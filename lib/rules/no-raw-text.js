/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { parse, AST } = require('vue-eslint-parser')
const { defineTemplateBodyVisitor } = require('../utils/index')

const hasOnlyLineBreak = value => /^[\r\n\t\f\v]+$/.test(value.replace(/ /g, ''))
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
  } else if ((node.parent && node.parent.type === 'VAttribute' && node.parent.directive) &&
    (node.parent.key && node.parent.key.type === 'VDirectiveKey')) {
  }
}

function checkRawText (context, value, loc) {
  if (typeof value !== 'string' || hasOnlyLineBreak(value)) { return }

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
  return defineTemplateBodyVisitor(context, { // template block
    VExpressionContainer (node) {
      checkVExpressionContainerText(context, node)
    },

    VText (node) {
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
    schema: []
  },
  create
}
