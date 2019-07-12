/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { parse, AST } = require('vue-eslint-parser')
const { defineTemplateBodyVisitor } = require('../utils/index')

const hasOnlyLineBreak = value => /^[\r\n\t\f\v]+$/.test(value.replace(/ /g, ''))

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
      const varDeclNode = templateVariable.defs[0].node
      if (varDeclNode.init && varDeclNode.init.type === 'Literal') {
        return varDeclNode.init
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
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
}
