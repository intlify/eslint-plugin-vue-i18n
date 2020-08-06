/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { defineTemplateBodyVisitor } = require('../utils/index')

function checkDirective(context, node) {
  if (
    node.value &&
    node.value.type === 'VExpressionContainer' &&
    node.value.expression &&
    node.value.expression.type === 'Identifier'
  ) {
    const name = node.value.expression.name
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
  }
}

function checkComponent(context, node) {
  if (
    node.name.type === 'VIdentifier' &&
    node.name.name === 'bind' &&
    node.argument.type === 'VIdentifier' &&
    node.argument.name === 'path' &&
    node.parent.value &&
    node.parent.value.type === 'VExpressionContainer' &&
    node.parent.value.expression &&
    node.parent.value.expression.type === 'Identifier'
  ) {
    const name = node.parent.value.expression.name
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
  }
}

function checkCallExpression(context, node) {
  const funcName =
    (node.callee.type === 'MemberExpression' && node.callee.property.name) ||
    node.callee.name

  if (
    !/^(\$t|t|\$tc|tc)$/.test(funcName) ||
    !node.arguments ||
    !node.arguments.length
  ) {
    return
  }

  const [keyNode] = node.arguments
  if (keyNode.type === 'Identifier') {
    const name = keyNode.name
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
  }
}

function create(context) {
  return defineTemplateBodyVisitor(
    context,
    {
      "VAttribute[directive=true][key.name='t']"(node) {
        checkDirective(context, node)
      },

      "VAttribute[directive=true][key.name.name='t']"(node) {
        checkDirective(context, node)
      },

      'VElement:matches([name=i18n], [name=i18n-t]) > VStartTag > VAttribute[directive=true] > VDirectiveKey'(
        node
      ) {
        checkComponent(context, node)
      },

      CallExpression(node) {
        checkCallExpression(context, node)
      }
    },
    {
      CallExpression(node) {
        checkCallExpression(context, node)
      }
    }
  )
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow localization dynamic keys at localization methods',
      category: 'Best Practices',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create
}
