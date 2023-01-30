'use strict'

module.exports = {
  root: true,
  extends: ['plugin:vue/recommended', 'plugin:vue-i18n-ex/recommended'],
  rules: {
    'vue/multi-word-component-names': 'off'
  },
  settings: {
    'vue-i18n': {
      localeDir: `./src/resources/*.json`
    }
  }
}
