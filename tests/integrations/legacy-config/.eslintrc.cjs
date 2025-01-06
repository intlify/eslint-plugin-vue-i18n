'use strict'

module.exports = {
  root: true,
  extends: [
    'plugin:vue/recommended',
    'plugin:vue-i18n-ex/recommended-legacy'
  ],
  rules: {
    'vue/multi-word-component-names': 'off'
  },
  settings: {
    'vue-i18n-ex': {
      localeDir: `./src/resources/*.json`,
      messageSyntaxVersion: '^9.0.0'
    }
  }
}
