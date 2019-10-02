/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { parse, AST } = require('vue-eslint-parser')
const { defineTemplateBodyVisitor } = require('../utils/index')

const config = {}
const hasOnlyWhitespace = value => /^[\r\n\s\t\f\v]+$/.test(value)
const INNER_START_OFFSET = '<template>'.length

function calculateLoc (node, base = null) {
  return !base
    ? node.loc
    : {
      start: {
        line: base.loc.start.line,
        column: base.loc.start.column + (node.loc.start.column - INNER_START_OFFSET)
      },
      end: {
        line: base.loc.end.line,
        column: base.loc.end.column + (node.loc.end.column - INNER_START_OFFSET)
      }
    }
}

function checkVExpressionContainerText (context, node, baseNode = null) {
  if (!node.expression) { return }

  if (node.parent && node.parent.type === 'VElement') {
    // parent is element (e.g. <p>{{ ... }}</p>)
    if (node.expression.type === 'Literal') {
      const literalNode = node.expression
      const loc = calculateLoc(literalNode, baseNode)
      context.report({
        loc,
        message: `raw text '${literalNode.value}' is used`
      })
    } else if (node.expression.type === 'ConditionalExpression') {
      const targets = [node.expression.consequent, node.expression.alternate]
      targets.forEach(target => {
        if (target.type === 'Literal') {
          const loc = calculateLoc(target, baseNode)
          context.report({
            loc,
            message: `raw text '${target.value}' is used`
          })
        }
      })
    }
  } else if (node.parent && node.parent.type === 'VAttribute' && node.parent.directive) {
    // parent is directive (e.g <p v-xxx="..."></p>)
    const attrNode = node.parent
    if (attrNode.key && attrNode.key.type === 'VDirectiveKey') {
      if ((attrNode.key.name === 'text' || attrNode.key.name.name === 'text') && node.expression.type === 'Literal') {
        const literalNode = node.expression
        const loc = calculateLoc(literalNode, baseNode)
        context.report({
          loc,
          message: `raw text '${literalNode.value}' is used`
        })
      }
    }
  }
}

function checkRawText (context, value, loc) {
  if (typeof value !== 'string' || hasOnlyWhitespace(value)) { return }

  if (config.ignorePattern.test(value.trim())) { return }

  if (config.ignoreText.includes(value.trim())) { return }

  context.report({
    loc,
    message: `raw text '${value}' is used`
  })
}

function findVariable (variables, name) {
  return variables.find(variable => variable.name === name)
}

function getComponentTemplateValueNode (context, node) {
  const templateNode = node.properties
    .find(p =>
      p.type === 'Property' &&
      p.key.type === 'Identifier' &&
      p.key.name === 'template'
    )

  if (templateNode) {
    if (templateNode.value.type === 'Literal') {
      return templateNode.value
    } else if (templateNode.value.type === 'Identifier') {
      const templateVariable = findVariable(context.getScope().variables, templateNode.value.name)
      if (templateVariable) {
        const varDeclNode = templateVariable.defs[0].node
        if (varDeclNode.init && varDeclNode.init.type === 'Literal') {
          return varDeclNode.init
        }
      }
    }
  }

  return null
}

function getComponentTemplateNode (value) {
  return parse(`<template>${value}</template>`).templateBody
}

function create (context) {
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

  return defineTemplateBodyVisitor(context, { // template block
    VExpressionContainer (node) {
      checkVExpressionContainerText(context, node)
    },

    VText (node) {
      if (config.ignoreNodes.includes(node.parent.name)) { return }

      checkRawText(context, node.value, node.loc)
    }
  }, { // script block or scripts
    ObjectExpression (node) {
      const valueNode = getComponentTemplateValueNode(context, node)
      if (!valueNode) { return }

      const templateNode = getComponentTemplateNode(valueNode.value)
      AST.traverseNodes(templateNode, {
        enterNode (node) {
          if (node.type === 'VText') {
            checkRawText(context, node.value, valueNode.loc)
          } else if (node.type === 'VExpressionContainer') {
            checkVExpressionContainerText(context, node, valueNode)
          }
        },
        leaveNode () {}
      })
    },

    JSXText (node) {
      checkRawText(context, node.value, node.loc)
    }
  })
}

module.exports = {
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
