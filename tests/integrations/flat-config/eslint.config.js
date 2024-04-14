import vue from 'eslint-plugin-vue'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

export default [
  ...vue.configs['flat/recommended'],
  ...vueI18n.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off'
    },
    settings: {
      'vue-i18n': {
        localeDir: './src/resources/*.json',
        messageSyntaxVersion: '^9.0.0'
      }
    }
  }
]
