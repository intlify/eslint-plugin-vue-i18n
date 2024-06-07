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
      for (const child of node.children) {
        if (child.type !== 'VElement') {
          continue
        }
        const placeAttr =
          getAttribute(child, 'place') || getDirective(child, 'bind', 'place')
        if (placeAttr) {
          context.report({
            node: placeAttr.key,
            messageId: 'deprecated'
          })
        }
      }
    }
  })
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow using deprecated `place` attribute (Removed in Vue I18n 9.0.0+)',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-deprecated-i18n-place-attr.html',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      deprecated: 'Deprecated `place` attribute was found. Use v-slot instead.'
    }
  },
  create
})
