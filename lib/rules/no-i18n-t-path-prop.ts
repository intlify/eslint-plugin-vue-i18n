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

function create(context: RuleContext): RuleListener {
  return defineTemplateBodyVisitor(context, {
    VElement(node: VAST.VElement) {
      if (node.name !== 'i18n-t') {
        return
      }
      const pathProp =
        getAttribute(node, 'path') || getDirective(node, 'bind', 'path')
      if (pathProp) {
        context.report({
          node: pathProp.key,
          messageId: 'disallow',
          fix(fixer) {
            if (pathProp.directive) {
              return fixer.replaceText(pathProp.key.argument!, 'keypath')
            } else {
              return fixer.replaceText(pathProp.key, 'keypath')
            }
          }
        })
      }
    }
  })
}

export = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow using `path` prop with `<i18n-t>`',
      category: 'Recommended',
      recommended: false
    },
    fixable: 'code',
    schema: [],
    messages: {
      disallow:
        'Cannot use `path` prop with `<i18n-t>` component. Use `keypath` prop instead.'
    }
  },
  create
}
