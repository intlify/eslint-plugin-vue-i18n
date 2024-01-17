import type { RuleContext, RuleListener } from '../types'
import { getSourceCode } from '../utils/compat'
import { isI18nBlock, getAttribute } from '../utils/index'
import { createRule } from '../utils/rule'

export = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'require or disallow the locale attribute on `<i18n>` block',
      category: 'Stylistic Issues',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/sfc-locale-attr.html',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        enum: ['always', 'never']
      }
    ],
    messages: {
      required: '`locale` attribute is required.',
      disallowed: '`locale` attribute is disallowed.'
    }
  },
  create(context: RuleContext): RuleListener {
    const sourceCode = getSourceCode(context)
    const df = sourceCode.parserServices.getDocumentFragment?.()
    if (!df) {
      return {}
    }
    const always = context.options[0] !== 'never'
    return {
      Program() {
        for (const i18n of df.children.filter(isI18nBlock)) {
          const srcAttrs = getAttribute(i18n, 'src')
          if (srcAttrs != null) {
            continue
          }
          const localeAttrs = getAttribute(i18n, 'locale')

          if (
            localeAttrs != null &&
            localeAttrs.value != null &&
            localeAttrs.value.value
          ) {
            if (always) {
              continue
            }
            // disallowed
            context.report({
              loc: localeAttrs.loc,
              messageId: 'disallowed'
            })
          } else {
            if (!always) {
              continue
            }
            // missing
            context.report({
              loc: i18n.startTag.loc,
              messageId: 'required'
            })
          }
        }
      }
    }
  }
})
