import vue from 'eslint-plugin-vue'
import vueI18n from 'eslint-plugin-vue-i18n-ex'

export default [
  ...vue.configs['flat/recommended'],
  ...vueI18n.configs.recommended,
  {
    rules: {
      'vue/multi-word-component-names': 'off'
    },
    settings: {
      'vue-i18n-ex': {
        localeDir: './src/resources/*.json',
        messageSyntaxVersion: '^9.0.0'
      }
    }
  }
]
