'use strict'

module.exports = {
  root: true,
  extends: ['plugin:vue/recommended', 'plugin:@intlify/vue-i18n/recommended'],
  rules: {
    'vue/multi-word-component-names': 'off'
  },
  settings: {
    'vue-i18n': {
      localeDir: `./src/resources/*.json`,
      messageSyntaxVersion: '^9.0.0'
    }
  }
}
