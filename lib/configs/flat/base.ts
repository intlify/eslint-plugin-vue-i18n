/** DON'T EDIT THIS FILE; was created by scripts. */
export = [
  {
    name: '@intlify/vue-i18n:base:setup',
    plugins: {
      get '@intlify/vue-i18n'() {
        return require('../../index')
      }
    }
  },
  {
    name: '@intlify/vue-i18n:base:setup:json',
    files: ['*.json', '*.json5'],
    languageOptions: {
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('jsonc-eslint-parser')
      }
    }
  },
  {
    name: '@intlify/vue-i18n:base:setup:yaml',
    files: ['*.yaml', '*.yml'],
    languageOptions: {
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('yaml-eslint-parser')
      }
    },
    rules: {
      'no-irregular-whitespace': 'off',
      'spaced-comment': 'off'
    }
  }
]
