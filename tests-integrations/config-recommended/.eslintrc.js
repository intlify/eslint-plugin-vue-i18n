'use strict'

module.exports = {
  root: true,
  extends: ['plugin:vue/recommended', 'plugin:@intlify/vue-i18n/recommended'],
  settings: {
    'vue-i18n': {
      localeDir: `./src/resources/*.json`
    }
  }
}
