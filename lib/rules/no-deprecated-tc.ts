/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { defineTemplateBodyVisitor } from '../utils/index'
import { createRule } from '../utils/rule'

import type { RuleContext, RuleListener } from '../types'
import type { AST as VAST } from 'vue-eslint-parser'

function checkCallExpression(
  context: RuleContext,
  node: VAST.ESLintCallExpression
) {
  const funcName =
    (node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name) ||
    (node.callee.type === 'Identifier' && node.callee.name) ||
    ''

  if (/^(\$tc|tc)$/.test(funcName)) {
    context.report({
      node,
      message: `'${funcName}' is used, but it is deprecated. Use 't' or '$t' instead.`
    })
    return
  }
}

function create(context: RuleContext): RuleListener {
  return defineTemplateBodyVisitor(
    context,
    {
      CallExpression(node: VAST.ESLintCallExpression) {
        checkCallExpression(context, node)
      }
    },
    {
      CallExpression(node: VAST.ESLintCallExpression) {
        checkCallExpression(context, node)
      }
    }
  )
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow using deprecated `tc` or `$tc` (Deprecated in Vue I18n 10.0.0, removed fully in Vue I18n 11.0.0)',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-deprecated-tc.html',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
})
