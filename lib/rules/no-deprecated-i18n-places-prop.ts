/**
 * @author Yosuke Ota
 */
import {
  defineTemplateBodyVisitor,
  getAttribute,
  getDirective
} from '../utils/index'
import type { RuleContext, RuleListener } from '../types'
import type { AST as VAST } from 'vue-eslint-parser'
import { createRule } from '../utils/rule'

function create(context: RuleContext): RuleListener {
  return defineTemplateBodyVisitor(context, {
    VElement(node: VAST.VElement) {
      if (node.name !== 'i18n' && node.name !== 'i18n-t') {
        return
      }
      const placesProp =
        getAttribute(node, 'places') || getDirective(node, 'bind', 'places')
      if (placesProp) {
        context.report({
          node: placesProp.key,
          messageId: 'deprecated'
        })
      }
    }
  })
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow using deprecated `places` prop (Removed in Vue I18n 9.0.0+)',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-deprecated-i18n-places-prop.html',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      deprecated: 'Deprecated `places` prop was found. Use v-slot instead.'
    }
  },
  create
})
