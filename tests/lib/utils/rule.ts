import { strictEqual } from 'assert'
import { getRules } from '../../../scripts/lib/rules'

describe('valid rule meta', async () => {
  const rules = await getRules()
  for (const rule of rules) {
    it(`should be valid rule url for ${rule.id}.`, () => {
      strictEqual(
        rule.url,
        `https://eslint-plugin-vue-i18n.intlify.dev/rules/${rule.name}.html`
      )
    })
  }
})
