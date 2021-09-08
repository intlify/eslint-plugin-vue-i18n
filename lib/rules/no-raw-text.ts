/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { parse, AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import { parseJSON, getStaticJSONValue } from 'jsonc-eslint-parser'
import {
  defineTemplateBodyVisitor,
  getLocaleMessages,
  getStaticAttributes,
  getVueObjectType,
  isI18nBlock,
  isVElement
} from '../utils/index'
import type {
  JSXText,
  RuleContext,
  RuleFixer,
  Variable,
  RuleListener,
  SuggestionReportDescriptor,
  Fix,
  I18nLocaleMessageDictionary
} from '../types'

type LiteralValue = VAST.ESLintLiteral['value']
type StaticTemplateLiteral = VAST.ESLintTemplateLiteral & {
  quasis: [VAST.ESLintTemplateElement]
  expressions: [/* empty */]
}
type TemplateOptionValueNode = VAST.ESLintLiteral | StaticTemplateLiteral
type NodeScope = 'template' | 'template-option' | 'jsx'
const config: {
  ignorePattern: RegExp
  ignoreNodes: string[]
  ignoreText: string[]
} = { ignorePattern: /^[^\S\s]$/, ignoreNodes: [], ignoreText: [] }
const hasOnlyWhitespace = (value: string) => /^[\r\n\s\t\f\v]+$/.test(value)
const INNER_START_OFFSET = '<template>'.length

function isStaticTemplateLiteral(
  node:
    | VAST.ESLintExpression
    | VAST.VExpressionContainer['expression']
    | VAST.ESLintPattern
): node is StaticTemplateLiteral {
  return Boolean(
    node && node.type === 'TemplateLiteral' && node.expressions.length === 0
  )
}
function calculateRange(
  node: VAST.ESLintLiteral | StaticTemplateLiteral | VAST.VText | JSXText,
  base: TemplateOptionValueNode | null
): [number, number] {
  if (!base) {
    return node.range
  }
  const offset = base.range[0] + 1 /* quote */ - INNER_START_OFFSET
  return [offset + node.range[0], offset + node.range[1]]
}
function calculateLoc(
  node: VAST.ESLintLiteral | StaticTemplateLiteral | VAST.VText | JSXText,
  base: TemplateOptionValueNode | null,
  context: RuleContext
) {
  if (!base) {
    return node.loc
  }
  const range = calculateRange(node, base)
  return {
    start: context.getSourceCode().getLocFromIndex(range[0]),
    end: context.getSourceCode().getLocFromIndex(range[1])
  }
}

function testValue(value: LiteralValue): boolean {
  if (typeof value === 'string') {
    return (
      hasOnlyWhitespace(value) ||
      config.ignorePattern.test(value.trim()) ||
      config.ignoreText.includes(value.trim())
    )
  } else {
    return false
  }
}

// parent is directive (e.g <p v-xxx="..."></p>)
function checkVAttributeDirective(
  context: RuleContext,
  node: VAST.VExpressionContainer & {
    parent: VAST.VDirective
  },
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  const attrNode = node.parent
  if (attrNode.key && attrNode.key.type === 'VDirectiveKey') {
    if (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore -- for vue-eslint-parser v5
      (attrNode.key.name === 'text' ||
        // for vue-eslint-parser v6+
        attrNode.key.name.name === 'text') &&
      node.expression
    ) {
      checkExpressionContainerText(context, node.expression, baseNode, scope)
    }
  }
}

function checkVExpressionContainer(
  context: RuleContext,
  node: VAST.VExpressionContainer,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  if (!node.expression) {
    return
  }

  if (node.parent && node.parent.type === 'VElement') {
    // parent is element (e.g. <p>{{ ... }}</p>)
    checkExpressionContainerText(context, node.expression, baseNode, scope)
  } else if (
    node.parent &&
    node.parent.type === 'VAttribute' &&
    node.parent.directive
  ) {
    checkVAttributeDirective(
      context,
      node as VAST.VExpressionContainer & {
        parent: VAST.VDirective
      },
      baseNode,
      scope
    )
  }
}
function checkExpressionContainerText(
  context: RuleContext,
  expression: Exclude<VAST.VExpressionContainer['expression'], null>,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  if (expression.type === 'Literal') {
    checkLiteral(context, expression, baseNode, scope)
  } else if (isStaticTemplateLiteral(expression)) {
    checkLiteral(context, expression, baseNode, scope)
  } else if (expression.type === 'ConditionalExpression') {
    const targets = [expression.consequent, expression.alternate]
    targets.forEach(target => {
      if (target.type === 'Literal') {
        checkLiteral(context, target, baseNode, scope)
      } else if (isStaticTemplateLiteral(target)) {
        checkLiteral(context, target, baseNode, scope)
      }
    })
  }
}

function checkLiteral(
  context: RuleContext,
  literal: VAST.ESLintLiteral | StaticTemplateLiteral,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  const value =
    literal.type === 'Literal' ? literal.value : literal.quasis[0].value.cooked

  if (testValue(value)) {
    return
  }

  const loc = calculateLoc(literal, baseNode, context)
  context.report({
    loc,
    message: `raw text '${value}' is used`,
    suggest: buildSuggest()
  })

  function buildSuggest(): SuggestionReportDescriptor[] | null {
    if (scope === 'template-option') {
      if (!withoutEscape(context, baseNode)) {
        return null
      }
    } else if (scope !== 'template') {
      return null
    }
    const replaceRange = calculateRange(literal, baseNode)

    const suggest: SuggestionReportDescriptor[] = []

    for (const key of extractMessageKeys(context, `${value}`)) {
      suggest.push({
        desc: `Replace to "$t('${key}')".`,
        fix(fixer) {
          return fixer.replaceTextRange(replaceRange, `$t('${key}')`)
        }
      })
    }
    const i18nBlocks = getFixableI18nBlocks(context, `${value}`)
    if (i18nBlocks) {
      suggest.push({
        desc: "Add the resource to the '<i18n>' block.",
        fix(fixer) {
          return generateFixAddI18nBlock(
            context,
            fixer,
            i18nBlocks,
            `${value}`,
            [
              fixer.insertTextBeforeRange(replaceRange, '$t('),
              fixer.insertTextAfterRange(replaceRange, ')')
            ]
          )
        }
      })
    }

    return suggest
  }
}

function checkText(
  context: RuleContext,
  textNode: VAST.VText | JSXText,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  const value = textNode.value
  if (testValue(value)) {
    return
  }

  const loc = calculateLoc(textNode, baseNode, context)
  context.report({
    loc,
    message: `raw text '${value}' is used`,
    suggest: buildSuggest()
  })

  function buildSuggest(): SuggestionReportDescriptor[] | null {
    if (scope === 'template-option') {
      if (!withoutEscape(context, baseNode)) {
        return null
      }
    }
    const replaceRange = calculateRange(textNode, baseNode)
    const codeText = context.getSourceCode().text.slice(...replaceRange)
    const baseQuote = baseNode
      ? context.getSourceCode().getText(baseNode)[0]
      : ''
    const quote =
      !codeText.includes("'") && !codeText.includes('\n') && baseQuote !== "'"
        ? "'"
        : !codeText.includes('"') &&
          !codeText.includes('\n') &&
          baseQuote !== '"'
        ? '"'
        : !codeText.includes('`') && baseQuote !== '`'
        ? '`'
        : null
    if (quote == null) {
      return null
    }

    const before = `${scope === 'jsx' ? '{' : '{{'}$t(${quote}`
    const after = `${quote})${scope === 'jsx' ? '}' : '}}'}`

    const suggest: SuggestionReportDescriptor[] = []

    for (const key of extractMessageKeys(context, value)) {
      suggest.push({
        desc: `Replace to "${before}${key}${after}".`,
        fix(fixer) {
          return fixer.replaceTextRange(replaceRange, before + key + after)
        }
      })
    }
    const i18nBlocks = getFixableI18nBlocks(context, `${value}`)
    if (i18nBlocks) {
      suggest.push({
        desc: "Add the resource to the '<i18n>' block.",
        fix(fixer) {
          return generateFixAddI18nBlock(
            context,
            fixer,
            i18nBlocks,
            `${value}`,
            [
              fixer.insertTextBeforeRange(replaceRange, before),
              fixer.insertTextAfterRange(replaceRange, after)
            ]
          )
        }
      })
    }

    return suggest
  }
}

function findVariable(variables: Variable[], name: string) {
  return variables.find(variable => variable.name === name)
}

function getComponentTemplateValueNode(
  context: RuleContext,
  node: VAST.ESLintObjectExpression
): TemplateOptionValueNode | null {
  const templateNode = node.properties.find(
    (p): p is VAST.ESLintProperty =>
      p.type === 'Property' &&
      p.key.type === 'Identifier' &&
      p.key.name === 'template'
  )

  if (templateNode) {
    if (templateNode.value.type === 'Literal') {
      return templateNode.value
    } else if (isStaticTemplateLiteral(templateNode.value)) {
      return templateNode.value
    } else if (templateNode.value.type === 'Identifier') {
      const templateVariable = findVariable(
        context.getScope().variables,
        templateNode.value.name
      )
      if (templateVariable) {
        const varDeclNode = templateVariable.defs[0]
          .node as VAST.ESLintVariableDeclarator
        if (varDeclNode.init) {
          if (varDeclNode.init.type === 'Literal') {
            return varDeclNode.init
          } else if (isStaticTemplateLiteral(varDeclNode.init)) {
            return varDeclNode.init
          }
        }
      }
    }
  }

  return null
}

function getComponentTemplateNode(node: TemplateOptionValueNode) {
  return parse(
    `<template>${
      node.type === 'TemplateLiteral' ? node.quasis[0].value.cooked : node.value
    }</template>`,
    {}
  ).templateBody!
}

function withoutEscape(
  context: RuleContext,
  baseNode: TemplateOptionValueNode | null
) {
  if (!baseNode) {
    return false
  }
  const sourceText = context.getSourceCode().getText(baseNode).slice(1, -1)
  const templateText =
    baseNode.type === 'TemplateLiteral'
      ? baseNode.quasis[0].value.cooked
      : `${baseNode.value}`
  return sourceText === templateText
}

type I18nBlockInfo = {
  attrs: { [name: string]: string | undefined }
  i18n: VAST.VElement
  offsets: {
    getLoc: (index: number) => { line: number; column: number }
    getIndex: (index: number) => number
  }
  objects: JSONAST.JSONObjectExpression[]
}

function getFixableI18nBlocks(
  context: RuleContext,
  newKey: string
): I18nBlockInfo[] | null {
  const df = context.parserServices.getDocumentFragment?.()
  if (!df) {
    return null
  }
  const i18nBlocks: I18nBlockInfo[] = []
  for (const i18n of df.children.filter(isI18nBlock)) {
    const attrs = getStaticAttributes(i18n)
    if (
      attrs.src != null ||
      (attrs.lang != null && attrs.lang !== 'json' && attrs.lang !== 'json5') // Do not support yaml
    ) {
      return null
    }
    const textNode = i18n.children[0]
    const sourceString =
      textNode != null && textNode.type === 'VText' && textNode.value
    if (!sourceString) {
      return null
    }
    try {
      const ast = parseJSON(sourceString)
      const root = ast.body[0].expression
      if (root.type !== 'JSONObjectExpression') {
        // Maybe invalid messages
        return null
      }
      const objects: JSONAST.JSONObjectExpression[] = []
      if (attrs.locale) {
        objects.push(root)
      } else {
        for (const prop of root.properties) {
          if (prop.value.type !== 'JSONObjectExpression') {
            // Maybe invalid messages
            return null
          }
          objects.push(prop.value)
        }
      }

      // check for new key
      // If there are duplicate keys, the addition will be stopped.
      for (const objNode of objects) {
        if (
          objNode.properties.some(prop => {
            const keyValue = `${getStaticJSONValue(prop.key)}`
            return keyValue === newKey
          })
        ) {
          return null
        }
      }

      const offset = textNode.range[0]

      const getIndex = (index: number): number => offset + index
      i18nBlocks.push({
        attrs,
        i18n,
        objects,
        offsets: {
          getLoc: (index: number) => {
            return context.getSourceCode().getLocFromIndex(getIndex(index))
          },
          getIndex
        }
      })
    } catch {
      return null
    }
  }

  return i18nBlocks
}

function* generateFixAddI18nBlock(
  context: RuleContext,
  fixer: RuleFixer,
  i18nBlocks: I18nBlockInfo[],
  resource: string,
  replaceFixes: Fix[]
): IterableIterator<Fix> {
  const text = JSON.stringify(resource)
  const df = context.parserServices.getDocumentFragment!()!
  const tokenStore = context.parserServices.getTemplateBodyTokenStore()

  if (!i18nBlocks.length) {
    let baseToken: VAST.VElement | VAST.Token = df.children.find(isVElement)!
    let beforeToken = tokenStore.getTokenBefore(baseToken, {
      includeComments: true
    })
    while (beforeToken && beforeToken.type === 'HTMLComment') {
      baseToken = beforeToken
      beforeToken = tokenStore.getTokenBefore(beforeToken, {
        includeComments: true
      })
    }
    yield fixer.insertTextBeforeRange(
      baseToken.range,
      `<i18n>\n{\n  "en": {\n    ${text}: ${text}\n  }\n}\n</i18n>\n\n`
    )
    yield* replaceFixes

    return
  }
  const replaceFix = replaceFixes[0]

  const after = i18nBlocks.find(e => replaceFix.range[1] < e.i18n.range[0])
  for (const { i18n, offsets, objects } of i18nBlocks) {
    if (after && after.i18n === i18n) {
      yield* replaceFixes
    }
    for (const objectNode of objects) {
      const first = objectNode.properties[0]

      let indent =
        /^\s*/.exec(
          context.getSourceCode().lines[
            offsets.getLoc(objectNode.range[0]).line - 1
          ]
        )![0] + '  '
      let next = ''
      if (first) {
        if (objectNode.loc.start.line === first.loc.start.line) {
          next = ',\n' + indent
        } else {
          indent = /^\s*/.exec(
            context.getSourceCode().lines[
              offsets.getLoc(first.range[0]).line - 1
            ]
          )![0]
          next = ','
        }
      }

      yield fixer.insertTextAfterRange(
        [
          offsets.getIndex(objectNode.range[0]),
          offsets.getIndex(objectNode.range[0] + 1)
        ],
        `\n${indent}${text}: ${text}${next}`
      )
    }
  }

  if (after == null) {
    yield* replaceFixes
  }
}

function extractMessageKeys(
  context: RuleContext,
  targetValue: string
): string[] {
  const keys = new Set<string>()
  const localeMessages = getLocaleMessages(context, {
    ignoreMissingSettingsError: true
  })
  for (const localeMessage of localeMessages.localeMessages) {
    for (const locale of localeMessage.locales) {
      const messages = localeMessage.getMessagesFromLocale(locale)
      for (const key of extractMessageKeysFromObject(messages, [])) {
        keys.add(key)
      }
    }
  }
  return [...keys].sort()

  function* extractMessageKeysFromObject(
    messages: I18nLocaleMessageDictionary,
    paths: string[]
  ): Iterable<string> {
    for (const key of Object.keys(messages)) {
      const value = messages[key]
      if (typeof value === 'string') {
        if (targetValue === value) {
          yield [...paths, key].join('.')
        }
      } else {
        yield* extractMessageKeysFromObject(value, [...paths, key])
      }
    }
  }
}

function create(context: RuleContext): RuleListener {
  config.ignorePattern = /^$/
  config.ignoreNodes = []
  config.ignoreText = []

  if (context.options[0] && context.options[0].ignorePattern) {
    config.ignorePattern = new RegExp(context.options[0].ignorePattern, 'u')
  }

  if (context.options[0] && context.options[0].ignoreNodes) {
    config.ignoreNodes = context.options[0].ignoreNodes
  }

  if (context.options[0] && context.options[0].ignoreText) {
    config.ignoreText = context.options[0].ignoreText
  }

  return defineTemplateBodyVisitor(
    context,
    {
      // template block
      VExpressionContainer(node: VAST.VExpressionContainer) {
        checkVExpressionContainer(context, node, null, 'template')
      },

      VText(node: VAST.VText) {
        if (config.ignoreNodes.includes((node.parent as VAST.VElement).name)) {
          return
        }

        checkText(context, node, null, 'template')
      }
    },
    {
      // script block or scripts
      ObjectExpression(node: VAST.ESLintObjectExpression) {
        const valueNode = getComponentTemplateValueNode(context, node)
        if (!valueNode) {
          return
        }
        if (
          getVueObjectType(context, node) == null ||
          (valueNode.type === 'Literal' && valueNode.value == null)
        ) {
          return
        }

        const templateNode = getComponentTemplateNode(valueNode)
        VAST.traverseNodes(templateNode, {
          enterNode(node) {
            if (node.type === 'VText') {
              checkText(context, node, valueNode, 'template-option')
            } else if (node.type === 'VExpressionContainer') {
              checkVExpressionContainer(
                context,
                node,
                valueNode,
                'template-option'
              )
            }
          },
          leaveNode() {
            // noop
          }
        })
      },

      JSXText(node: JSXText) {
        checkText(context, node, null, 'jsx')
      }
    }
  )
}

export = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow to string literal in template or JSX',
      category: 'Recommended',
      recommended: true
    },
    fixable: null,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          ignoreNodes: {
            type: 'array'
          },
          ignorePattern: {
            type: 'string'
          },
          ignoreText: {
            type: 'array'
          }
        }
      }
    ]
  },
  create
}
