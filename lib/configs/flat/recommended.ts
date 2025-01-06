/** DON'T EDIT THIS FILE; was created by scripts. */
const globals = require('globals')
const config = require('./base')
export = [
  ...config,
  {
    name: 'vue-i18n-ex:recommended:setup',
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  },
  {
    name: 'vue-i18n-ex:recommended:rules',
    rules: {
      'vue-i18n-ex/no-deprecated-i18n-component': 'warn',
      'vue-i18n-ex/no-deprecated-i18n-place-attr': 'warn',
      'vue-i18n-ex/no-deprecated-i18n-places-prop': 'warn',
      'vue-i18n-ex/no-deprecated-modulo-syntax': 'warn',
      'vue-i18n-ex/no-deprecated-tc': 'warn',
      'vue-i18n-ex/no-deprecated-v-t': 'warn',
      'vue-i18n-ex/no-html-messages': 'warn',
      'vue-i18n-ex/no-i18n-t-path-prop': 'warn',
      'vue-i18n-ex/no-missing-keys': 'warn',
      'vue-i18n-ex/no-raw-text': 'warn',
      'vue-i18n-ex/no-v-html': 'warn',
      'vue-i18n-ex/valid-message-syntax': 'warn'
    }
  }
]
