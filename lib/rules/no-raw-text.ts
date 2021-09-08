/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { parse, AST as VAST } from 'vue-eslint-parser'
import { defineTemplateBodyVisitor, getVueObjectType } from '../utils/index'
import type {
  JSXText,
  RuleContext,
  Variable,
  RuleListener,
  SourceLocation
} from '../types'

type AnyValue =
  | VAST.ESLintLiteral['value']
  | VAST.ESLintTemplateElement['value']
const config: {
  ignorePattern: RegExp
  ignoreNodes: string[]
  ignoreText: string[]
} = { ignorePattern: /^[^\S\s]$/, ignoreNodes: [], ignoreText: [] }
const hasOnlyWhitespace = (value: string) => /^[\r\n\s\t\f\v]+$/.test(value)
const hasTemplateElementValue = (
  value: AnyValue
): value is { raw: string; cooked: string } =>
  value != null &&
  typeof value === 'object' &&
  'raw' in value &&
  typeof value.raw === 'string' &&
  'cooked' in value &&
  typeof value.cooked === 'string'
const INNER_START_OFFSET = '<template>'.length

function calculateLoc(
  node: VAST.ESLintLiteral | VAST.ESLintTemplateElement,
  base: VAST.ESLintLiteral | VAST.ESLintTemplateElement | null = null
) {
  return !base
    ? node.loc
    : {
        start: {
          line: base.loc.start.line,
          column:
            base.loc.start.column + (node.loc.start.column - INNER_START_OFFSET)
        },
        end: {
          line: base.loc.end.line,
          column:
            base.loc.end.column + (node.loc.end.column - INNER_START_OFFSET)
        }
      }
}

function testTextable(value: string): boolean {
  return (
    hasOnlyWhitespace(value) ||
    config.ignorePattern.test(value.trim()) ||
    config.ignoreText.includes(value.trim())
  )
}

function testValue(value: AnyValue): boolean {
  if (typeof value === 'string') {
    return testTextable(value)
  } else if (hasTemplateElementValue(value)) {
    return testTextable(value.raw)
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
  baseNode = null
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
      checkExpressionContainerText(context, node.expression, baseNode)
    }
  }
}

function checkVExpressionContainer(
  context: RuleContext,
  node: VAST.VExpressionContainer,
  baseNode: VAST.ESLintLiteral | VAST.ESLintTemplateElement | null = null
) {
  if (!node.expression) {
    return
  }

  if (node.parent && node.parent.type === 'VElement') {
    // parent is element (e.g. <p>{{ ... }}</p>)
    checkExpressionContainerText(context, node.expression, baseNode)
  } else if (
    node.parent &&
    node.parent.type === 'VAttribute' &&
    node.parent.directive
  ) {
    checkVAttributeDirective(
      context,
      node as VAST.VExpressionContainer & {
        parent: VAST.VDirective
      }
    )
  }
}
function checkExpressionContainerText(
  context: RuleContext,
  expression: Exclude<VAST.VExpressionContainer['expression'], null>,
  baseNode: VAST.ESLintLiteral | VAST.ESLintTemplateElement | null = null
) {
  if (expression.type === 'Literal') {
    const literalNode = expression
    if (testValue(literalNode.value)) {
      return
    }

    const loc = calculateLoc(literalNode, baseNode)
    context.report({
      loc,
      message: `raw text '${literalNode.value}' is used`
    })
  } else if (
    expression.type === 'TemplateLiteral' &&
    expression.expressions.length === 0
  ) {
    const templateNode = expression.quasis[0]
    if (testValue(templateNode.value)) {
      return
    }

    const loc = calculateLoc(templateNode, baseNode)
    context.report({
      loc,
      message: `raw text '${templateNode.value.raw}' is used`
    })
  } else if (expression.type === 'ConditionalExpression') {
    const targets = [expression.consequent, expression.alternate]
    targets.forEach(target => {
      if (target.type === 'Literal') {
        if (testValue(target.value)) {
          return
        }

        const loc = calculateLoc(target, baseNode)
        context.report({
          loc,
          message: `raw text '${target.value}' is used`
        })
      } else if (
        target.type === 'TemplateLiteral' &&
        target.expressions.length === 0
      ) {
        const node = target.quasis[0]
        if (testValue(node.value)) {
          return
        }

        const loc = calculateLoc(node, baseNode)
        context.report({
          loc,
          message: `raw text '${node.value.raw}' is used`
        })
      }
    })
  }
}

function checkRawText(
  context: RuleContext,
  value: string,
  loc: SourceLocation
) {
  if (testValue(value)) {
    return
  }

  context.report({
    loc,
    message: `raw text '${value}' is used`
  })
}

function findVariable(variables: Variable[], name: string) {
  return variables.find(variable => variable.name === name)
}

function getComponentTemplateValueNode(
  context: RuleContext,
  node: VAST.ESLintObjectExpression
): VAST.ESLintLiteral | VAST.ESLintTemplateElement | null {
  const templateNode = node.properties.find(
    (p): p is VAST.ESLintProperty =>
      p.type === 'Property' &&
      p.key.type === 'Identifier' &&
      p.key.name === 'template'
  )

  if (templateNode) {
    if (templateNode.value.type === 'Literal') {
      return templateNode.value
    } else if (
      templateNode.value.type === 'TemplateLiteral' &&
      templateNode.value.expressions.length === 0
    ) {
      return templateNode.value.quasis[0]
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
          } else if (
            varDeclNode.init.type === 'TemplateLiteral' &&
            varDeclNode.init.expressions.length === 0
          ) {
            return varDeclNode.init.quasis[0]
          }
        }
      }
    }
  }

  return null
}

function getComponentTemplateNode(value: AnyValue) {
  return parse(
    `<template>${
      // prettier-ignore
      typeof value === 'string'
        ? value
        : hasTemplateElementValue(value)
          ? value.raw
          : value
    }</template>`,
    {}
  ).templateBody!
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
        checkVExpressionContainer(context, node)
      },

      VText(node: VAST.VText) {
        if (config.ignoreNodes.includes((node.parent as VAST.VElement).name)) {
          return
        }

        checkRawText(context, node.value, node.loc)
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
          valueNode.value == null
        ) {
          return
        }

        const templateNode = getComponentTemplateNode(valueNode.value)
        VAST.traverseNodes(templateNode, {
          enterNode(node) {
            if (node.type === 'VText') {
              checkRawText(context, node.value, valueNode.loc)
            } else if (node.type === 'VExpressionContainer') {
              checkVExpressionContainer(context, node, valueNode)
            }
          },
          leaveNode() {
            // noop
          }
        })
      },

      JSXText(node: JSXText) {
        checkRawText(context, node.value, node.loc)
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
