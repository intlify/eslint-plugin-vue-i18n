/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as VAST } from 'vue-eslint-parser'
import { defineTemplateBodyVisitor } from '../utils/index'
import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'

function checkDirective(context: RuleContext, node: VAST.VDirective) {
  if (
    node.value &&
    node.value.type === 'VExpressionContainer' &&
    node.value.expression &&
    node.value.expression.type === 'CallExpression'
  ) {
    const expressionNode = node.value.expression
    const funcName =
      (expressionNode.callee.type === 'MemberExpression' &&
        expressionNode.callee.property.type === 'Identifier' &&
        expressionNode.callee.property.name) ||
      (expressionNode.callee.type === 'Identifier' &&
        expressionNode.callee.name) ||
      ''
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

function create(context: RuleContext): RuleListener {
  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='html']"(node: VAST.VDirective) {
      checkDirective(context, node)
    },

    "VAttribute[directive=true][key.name.name='html']"(node: VAST.VDirective) {
      checkDirective(context, node)
    }
  })
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow use of localization methods on v-html to prevent XSS attack',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-v-html.html',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
})
