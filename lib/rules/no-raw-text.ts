/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { parse, AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import { parseJSON, getStaticJSONValue } from 'jsonc-eslint-parser'
import type { StaticLiteral } from '../utils/index'
import {
  getStaticLiteralValue,
  isStaticLiteral,
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
  I18nLocaleMessageDictionary,
  Range
} from '../types'
import { isKebabCase, pascalCase } from '../utils/casing'
import { createRule } from '../utils/rule'
import { toRegExp } from '../utils/regexp'
import { getSourceCode } from '../utils/compat'

type LiteralValue = VAST.ESLintLiteral['value']
type TemplateOptionValueNode = StaticLiteral
type NodeScope = 'template' | 'template-option' | 'jsx'
type TargetAttrs = { name: RegExp; attrs: Set<string> }
type Config = {
  attributes: TargetAttrs[]
  ignorePattern: RegExp
  ignoreNodes: string[]
  ignoreText: string[]
}
type Quotes = Set<'"' | "'" | '`'>
function getFixQuote(quotes: Quotes, code: string) {
  if (!code.includes('\n')) {
    for (const q of ["'", '"'] as const) {
      if (!quotes.has(q) && !code.includes(q)) {
        return q
      }
    }
  }
  if (!quotes.has('`') && !code.includes('`')) {
    return '`'
  }
  return null
}
const hasOnlyWhitespace = (value: string) => /^[\r\n\s\t\f\v]+$/.test(value)
const INNER_START_OFFSET = '<template>'.length

/**
 * Get the attribute to be verified from the element name.
 */
function getTargetAttrs(tagName: string, config: Config): Set<string> {
  const result = []
  for (const { name, attrs } of config.attributes) {
    name.lastIndex = 0
    if (name.test(tagName)) {
      result.push(...attrs)
    }
  }
  if (isKebabCase(tagName)) {
    result.push(...getTargetAttrs(pascalCase(tagName), config))
  }

  return new Set(result)
}

function calculateRange(
  node: StaticLiteral | VAST.VText | JSXText | VAST.VLiteral | VAST.VIdentifier,
  base: TemplateOptionValueNode | null
): Range {
  const range = node.range
  if (!base) {
    return range
  }
  const offset = base.range[0] + 1 /* quote */ - INNER_START_OFFSET
  return [offset + range[0], offset + range[1]]
}
function calculateLoc(
  node: StaticLiteral | VAST.VText | JSXText | VAST.VLiteral,
  base: TemplateOptionValueNode | null,
  context: RuleContext
) {
  if (!base) {
    return node.loc
  }
  const sourceCode = getSourceCode(context)
  const range = calculateRange(node, base)
  return {
    start: sourceCode.getLocFromIndex(range[0]),
    end: sourceCode.getLocFromIndex(range[1])
  }
}

function testValue(value: LiteralValue, config: Config): boolean {
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
  config: Config,
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
      checkExpressionContainerText(
        context,
        node.expression,
        config,
        baseNode,
        scope
      )
    }
  }
}

function checkVExpressionContainer(
  context: RuleContext,
  node: VAST.VExpressionContainer,
  config: Config,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  if (!node.expression) {
    return
  }

  if (node.parent && node.parent.type === 'VElement') {
    // parent is element (e.g. <p>{{ ... }}</p>)
    checkExpressionContainerText(
      context,
      node.expression,
      config,
      baseNode,
      scope
    )
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
      config,
      baseNode,
      scope
    )
  }
}
function checkExpressionContainerText(
  context: RuleContext,
  expression: Exclude<VAST.VExpressionContainer['expression'], null>,
  config: Config,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  if (isStaticLiteral(expression)) {
    checkLiteral(context, expression, config, baseNode, scope)
  } else if (expression.type === 'ConditionalExpression') {
    const targets = [expression.consequent, expression.alternate]
    targets.forEach(target => {
      if (isStaticLiteral(target)) {
        checkLiteral(context, target, config, baseNode, scope)
      }
    })
  }
}

function checkLiteral(
  context: RuleContext,
  literal: StaticLiteral,
  config: Config,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  const value = getStaticLiteralValue(literal)

  if (testValue(value, config)) {
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

function checkVAttribute(
  context: RuleContext,
  attribute: VAST.VAttribute,
  config: Config,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  if (!attribute.value) {
    return
  }
  const literal = attribute.value
  const value = literal.value

  if (testValue(value, config)) {
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
    const literalRange = calculateRange(literal, baseNode)
    const replaceRange = [literalRange[0] + 1, literalRange[1] - 1] as Range
    const keyRange = calculateRange(attribute.key, baseNode)
    const sourceCode = getSourceCode(context)
    const attrQuote = sourceCode.text[literalRange[0]]
    const quotes: Quotes = new Set(attrQuote as never)
    if (baseNode) {
      const baseQuote = sourceCode.text[baseNode.range[0]]
      quotes.add(baseQuote as never)
    }

    const suggest: SuggestionReportDescriptor[] = []

    for (const key of extractMessageKeys(context, `${value}`)) {
      const quote = getFixQuote(quotes, key)
      if (quote) {
        suggest.push({
          desc: `Replace to "$t('${key}')".`,
          fix(fixer) {
            return [
              fixer.insertTextBeforeRange(keyRange, ':'),
              fixer.replaceTextRange(replaceRange, `$t(${quote}${key}${quote})`)
            ]
          }
        })
      }
    }
    const i18nBlocks = getFixableI18nBlocks(context, `${value}`)
    const quote = getFixQuote(quotes, sourceCode.text.slice(...replaceRange))
    if (i18nBlocks && quote) {
      suggest.push({
        desc: "Add the resource to the '<i18n>' block.",
        fix(fixer) {
          return generateFixAddI18nBlock(
            context,
            fixer,
            i18nBlocks,
            `${value}`,
            [
              fixer.insertTextBeforeRange(keyRange, ':'),
              fixer.insertTextBeforeRange(replaceRange, `$t(${quote}`),
              fixer.insertTextAfterRange(replaceRange, `${quote})`)
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
  config: Config,
  baseNode: TemplateOptionValueNode | null,
  scope: NodeScope
) {
  const value = textNode.value
  if (testValue(value, config)) {
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
    const sourceCode = getSourceCode(context)
    const quotes: Quotes = new Set()
    if (baseNode) {
      const baseQuote = sourceCode.text[baseNode.range[0]]
      quotes.add(baseQuote as never)
    }

    const suggest: SuggestionReportDescriptor[] = []

    for (const key of extractMessageKeys(context, value)) {
      const quote = getFixQuote(quotes, key)
      if (quote) {
        const before = `${scope === 'jsx' ? '{' : '{{'}$t(${quote}`
        const after = `${quote})${scope === 'jsx' ? '}' : '}}'}`
        suggest.push({
          desc: `Replace to "${before}${key}${after}".`,
          fix(fixer) {
            return fixer.replaceTextRange(replaceRange, before + key + after)
          }
        })
      }
    }
    const i18nBlocks = getFixableI18nBlocks(context, `${value}`)
    const quote = getFixQuote(quotes, sourceCode.text.slice(...replaceRange))
    if (i18nBlocks && quote) {
      const before = `${scope === 'jsx' ? '{' : '{{'}$t(${quote}`
      const after = `${quote})${scope === 'jsx' ? '}' : '}}'}`
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
    if (isStaticLiteral(templateNode.value)) {
      return templateNode.value
    } else if (templateNode.value.type === 'Identifier') {
      const sourceCode = getSourceCode(context)
      const templateVariable = findVariable(
        sourceCode.getScope(node).variables,
        templateNode.value.name
      )
      if (templateVariable) {
        const varDeclNode = templateVariable.defs[0]
          .node as VAST.ESLintVariableDeclarator
        if (varDeclNode.init) {
          if (isStaticLiteral(varDeclNode.init)) {
            return varDeclNode.init
          }
        }
      }
    }
  }

  return null
}

function getComponentTemplateNode(node: TemplateOptionValueNode) {
  return parse(`<template>${getStaticLiteralValue(node)}</template>`, {})
    .templateBody!
}

function withoutEscape(
  context: RuleContext,
  baseNode: TemplateOptionValueNode | null
) {
  if (!baseNode) {
    return false
  }
  const sourceCode = getSourceCode(context)
  const sourceText = sourceCode.getText(baseNode).slice(1, -1)
  const templateText = `${getStaticLiteralValue(baseNode)}`
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
  const sourceCode = getSourceCode(context)
  const df = sourceCode.parserServices.getDocumentFragment?.()
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
            return sourceCode.getLocFromIndex(getIndex(index))
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
  const sourceCode = getSourceCode(context)
  const text = JSON.stringify(resource)
  const df = sourceCode.parserServices.getDocumentFragment!()!
  const tokenStore = sourceCode.parserServices.getTemplateBodyTokenStore()

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

      let indent = `${
        /^\s*/.exec(
          sourceCode.lines[offsets.getLoc(objectNode.range[0]).line - 1]
        )![0]
      }  `
      let next = ''
      if (first) {
        if (objectNode.loc.start.line === first.loc.start.line) {
          next = `,\n${indent}`
        } else {
          indent = /^\s*/.exec(
            sourceCode.lines[offsets.getLoc(first.range[0]).line - 1]
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
      if (value == null) {
        continue
      }
      if (typeof value !== 'object') {
        if (targetValue === value) {
          yield [...paths, key].join('.')
        }
      } else {
        yield* extractMessageKeysFromObject(value, [...paths, key])
      }
    }
  }
}

/**
 * Parse attributes option
 */
function parseTargetAttrs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any
) {
  const regexps: TargetAttrs[] = []
  for (const tagName of Object.keys(options)) {
    const attrs: Set<string> = new Set(options[tagName])
    regexps.push({
      name: toRegExp(tagName),
      attrs
    })
  }
  return regexps
}

function create(context: RuleContext): RuleListener {
  const options = context.options[0] || {}

  const config: Config = {
    attributes: [],
    ignorePattern: /^$/,
    ignoreNodes: [],
    ignoreText: []
  }

  if (options.ignorePattern) {
    config.ignorePattern = new RegExp(options.ignorePattern, 'u')
  }

  if (options.ignoreNodes) {
    config.ignoreNodes = options.ignoreNodes
  }

  if (options.ignoreText) {
    config.ignoreText = options.ignoreText
  }
  if (options.attributes) {
    config.attributes = parseTargetAttrs(options.attributes)
  }

  const templateVisitor = {
    // template block
    VExpressionContainer(
      node: VAST.VExpressionContainer,
      baseNode: TemplateOptionValueNode | null = null,
      scope: NodeScope = 'template'
    ) {
      checkVExpressionContainer(context, node, config, baseNode, scope)
    },

    VAttribute(
      node: VAST.VAttribute,
      baseNode: TemplateOptionValueNode | null = null,
      scope: NodeScope = 'template'
    ) {
      if (node.directive) {
        return
      }
      const tagName = node.parent.parent.rawName
      const attrName = node.key.name
      if (!getTargetAttrs(tagName, config).has(attrName)) {
        return
      }

      checkVAttribute(context, node, config, baseNode, scope)
    },

    VText(
      node: VAST.VText,
      baseNode: TemplateOptionValueNode | null = null,
      scope: NodeScope = 'template'
    ) {
      if (config.ignoreNodes.includes((node.parent as VAST.VElement).name)) {
        return
      }

      checkText(context, node, config, baseNode, scope)
    }
  }

  return defineTemplateBodyVisitor(context, templateVisitor, {
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
          const visitor:
            | ((
                node: VAST.Node,
                baseNode: TemplateOptionValueNode,
                scope: NodeScope
              ) => void)
            | undefined =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            templateVisitor[node.type as never] as any
          if (visitor) {
            visitor(node, valueNode, 'template-option')
          }
        },
        leaveNode() {
          // noop
        }
      })
    },

    JSXText(node: JSXText) {
      checkText(context, node, config, null, 'jsx')
    }
  })
}

export = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow to string literal in template or JSX',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-raw-text.html',
      recommended: true
    },
    fixable: null,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          attributes: {
            type: 'object',
            patternProperties: {
              '^(?:\\S+|/.*/[a-z]*)$': {
                type: 'array',
                items: { type: 'string' },
                uniqueItems: true
              }
            },
            additionalProperties: false
          },
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
})
