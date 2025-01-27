import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...vueI18n.configs['flat/recommended'],
  {
    rules: {
      // override rules
      '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',
      '@intlify/vue-i18n/no-dynamic-keys': 'error',
      '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
      '@intlify/vue-i18n/no-unknown-locale': 'error',
      '@intlify/vue-i18n/no-unused-keys': 'error',
      '@intlify/vue-i18n/prefer-sfc-lang-attr': 'error'
    },
    settings: {
      'vue-i18n': {
        localeDir: './src/resources/*.json',
        messageSyntaxVersion: '^11.0.0'
      }
    }
  }
]
