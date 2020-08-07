/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { parse, AST as VAST } from 'vue-eslint-parser'
import { defineTemplateBodyVisitor } from '../utils/index'
import type {
  JSXText,
  RuleContext,
  Variable,
  RuleListener,
  SourceLocation
} from '../types'

type AnyValue = VAST.ESLintLiteral['value']
const config: {
  ignorePattern: RegExp
  ignoreNodes: string[]
  ignoreText: string[]
} = { ignorePattern: /^[^\S\s]$/, ignoreNodes: [], ignoreText: [] }
const hasOnlyWhitespace = (value: string) => /^[\r\n\s\t\f\v]+$/.test(value)
const INNER_START_OFFSET = '<template>'.length

function calculateLoc(
  node: VAST.ESLintLiteral,
  base: VAST.ESLintLiteral | null = null
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

function testValue(value: AnyValue) {
  return (
    typeof value !== 'string' ||
    hasOnlyWhitespace(value) ||
    config.ignorePattern.test(value.trim()) ||
    config.ignoreText.includes(value.trim())
  )
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
      node.expression &&
      node.expression.type === 'Literal'
    ) {
      const literalNode = node.expression
      const value = literalNode.value

      if (testValue(value)) {
        return
      }

      const loc = calculateLoc(literalNode, baseNode)
      context.report({
        loc,
        message: `raw text '${literalNode.value}' is used`
      })
    }
  }
}

function checkVExpressionContainerText(
  context: RuleContext,
  node: VAST.VExpressionContainer,
  baseNode: VAST.ESLintLiteral | null = null
) {
  if (!node.expression) {
    return
  }

  if (node.parent && node.parent.type === 'VElement') {
    // parent is element (e.g. <p>{{ ... }}</p>)
    if (node.expression.type === 'Literal') {
      const literalNode = node.expression
      if (testValue(literalNode.value)) {
        return
      }

      const loc = calculateLoc(literalNode, baseNode)
      context.report({
        loc,
        message: `raw text '${literalNode.value}' is used`
      })
    } else if (node.expression.type === 'ConditionalExpression') {
      const targets = [node.expression.consequent, node.expression.alternate]
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
        }
      })
    }
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
): VAST.ESLintLiteral | null {
  const templateNode = node.properties.find(
    (p): p is VAST.ESLintProperty =>
      p.type === 'Property' &&
      p.key.type === 'Identifier' &&
      p.key.name === 'template'
  )

  if (templateNode) {
    if (templateNode.value.type === 'Literal') {
      return templateNode.value
    } else if (templateNode.value.type === 'Identifier') {
      const templateVariable = findVariable(
        context.getScope().variables,
        templateNode.value.name
      )
      if (templateVariable) {
        const varDeclNode = templateVariable.defs[0]
          .node as VAST.ESLintVariableDeclarator
        if (varDeclNode.init && varDeclNode.init.type === 'Literal') {
          return varDeclNode.init
        }
      }
    }
  }

  return null
}

function getComponentTemplateNode(value: AnyValue) {
  return parse(`<template>${value}</template>`, {}).templateBody!
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
        checkVExpressionContainerText(context, node)
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

        const templateNode = getComponentTemplateNode(valueNode.value)
        VAST.traverseNodes(templateNode, {
          enterNode(node) {
            if (node.type === 'VText') {
              checkRawText(context, node.value, valueNode.loc)
            } else if (node.type === 'VExpressionContainer') {
              checkVExpressionContainerText(context, node, valueNode)
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
