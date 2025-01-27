import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...vueI18n.configs.recommended,
  {
    rules: {
      // override rules
    },
    settings: {
      'vue-i18n': {
        localeDir: './src/resources/*.json',
        messageSyntaxVersion: '^11.0.0'
      }
    }
  }
]
