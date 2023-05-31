/** DON'T EDIT THIS FILE; was created by scripts. */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default {
  extends: [require.resolve('./base')],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true
  },
  rules: {
    '@intlify/vue-i18n/no-html-messages': 'warn',
    '@intlify/vue-i18n/no-missing-keys': 'warn',
    '@intlify/vue-i18n/no-raw-text': 'warn',
    '@intlify/vue-i18n/no-v-html': 'warn'
  }
}
