/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
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
    'vue-i18n-ex/no-html-messages': 'warn',
    'vue-i18n-ex/no-missing-keys': 'warn',
    'vue-i18n-ex/no-raw-text': 'warn',
    'vue-i18n-ex/no-v-html': 'warn'
  }
}
