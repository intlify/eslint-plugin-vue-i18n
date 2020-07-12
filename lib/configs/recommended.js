/** DON'T EDIT THIS FILE; was created by scripts. */
'use strict'

module.exports = {
  parser: require.resolve('vue-eslint-parser'),
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
  plugins: ['@intlify/vue-i18n'],
  rules: {
    '@intlify/vue-i18n/no-html-messages': 'warn',
    '@intlify/vue-i18n/no-missing-keys': 'warn',
    '@intlify/vue-i18n/no-raw-text': 'warn',
    '@intlify/vue-i18n/no-v-html': 'warn'
  }
}
