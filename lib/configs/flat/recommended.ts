/** DON'T EDIT THIS FILE; was created by scripts. */
const globals = require('globals')
const config = require('./base')
export = [
  ...config,
  {
    name: '@intlify/vue-i18n:recommended:setup',
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true
      },
      globals: globals.browser
    }
  },
  {
    name: '@intlify/vue-i18n:recommended:rules',
    rules: {
      '@intlify/vue-i18n/no-html-messages': 'warn',
      '@intlify/vue-i18n/no-missing-keys': 'warn',
      '@intlify/vue-i18n/no-raw-text': 'warn',
      '@intlify/vue-i18n/no-v-html': 'warn'
    }
  }
]
