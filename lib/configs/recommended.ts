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
