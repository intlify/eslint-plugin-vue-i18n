import { strictEqual } from 'assert'
import rules from '../../../lib/rules'

describe('valid rule meta', () => {
  for (const ruleId of Object.keys(rules)) {
    const rule = rules[ruleId as keyof typeof rules]

    it('should be valid rule url for ' + ruleId + '.', () => {
      strictEqual(
        rule.meta.docs.url,
        'https://eslint-plugin-vue-i18n.intlify.dev/rules/' + ruleId + '.html'
      )
    })
  }
})
