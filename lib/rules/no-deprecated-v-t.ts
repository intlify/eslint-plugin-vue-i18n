/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { defineTemplateBodyVisitor } from '../utils/index'
import { createRule } from '../utils/rule'

import type { RuleContext, RuleListener } from '../types'
import type { AST as VAST } from 'vue-eslint-parser'

function checkDirective(context: RuleContext, node: VAST.VDirective) {
  context.report({
    node,
    message: `'v-t' custom directive is used, but it is deprecated. Use 't' or '$t' instead.`
  })
}

function create(context: RuleContext): RuleListener {
  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='t']"(node: VAST.VDirective) {
      checkDirective(context, node)
    },

    "VAttribute[directive=true][key.name.name='t']"(node: VAST.VDirective) {
      checkDirective(context, node)
    }
  })
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow using deprecated `v-t` custom directive (Deprecated in Vue I18n 11.0.0, removed fully in Vue I18n 12.0.0)',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-deprecated-v-t.html',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create
})
