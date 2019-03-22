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
  plugins: ['vue-i18n'],
  rules: {
    'vue-i18n/no-html-messages': 'error',
    'vue-i18n/no-missing-keys': 'error',
    'vue-i18n/no-v-html': 'error'
  }
}
