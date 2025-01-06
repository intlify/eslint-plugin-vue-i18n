/** DON'T EDIT THIS FILE; was created by scripts. */
export = [
  {
    name: 'vue-i18n-ex:base:setup',
    plugins: {
      get 'vue-i18n-ex'() {
        return require('../../index')
      }
    }
  },
  {
    name: 'vue-i18n-ex:base:setup:json',
    files: ['*.json', '**/*.json', '*.json5', '**/*.json5'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: require('jsonc-eslint-parser')
      }
    }
  },
  {
    name: 'vue-i18n-ex:base:setup:yaml',
    files: ['*.yaml', '**/*.yaml', '*.yml', '**/*.yml'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: require('yaml-eslint-parser')
      }
    },
    rules: {
      'no-irregular-whitespace': 'off',
      'spaced-comment': 'off'
    }
  }
]
