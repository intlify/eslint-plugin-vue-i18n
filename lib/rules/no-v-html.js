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
    node.value.expression.type === 'CallExpression'
  ) {
    const expressionNode = node.value.expression
    const funcName =
      (expressionNode.callee.type === 'MemberExpression' &&
        expressionNode.callee.property.name) ||
      expressionNode.callee.name
    if (
      !/^(\$t|t|\$tc|tc)$/.test(funcName) ||
      !expressionNode.arguments ||
      !expressionNode.arguments.length
    ) {
      return
    }
    context.report({
      node,
      message: `Using ${funcName} on 'v-html' directive can lead to XSS attack.`
    })
  }
}

function create(context) {
  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='html']"(node) {
      checkDirective(context, node)
    },

    "VAttribute[directive=true][key.name.name='html']"(node) {
      checkDirective(context, node)
    }
  })
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow use of localization methods on v-html to prevent XSS attack',
      category: 'Recommended',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
}
