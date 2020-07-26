'use strict'

module.exports = {
  parser: require.resolve('vue-eslint-parser'),
  plugins: ['@intlify/vue-i18n'],
  overrides: [
    {
      files: ['*.json', '*.json5'],
      // TODO: If you do not use vue-eslint-parser, you will get an error in vue rules.
      // see https://github.com/vuejs/eslint-plugin-vue/pull/1262
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('eslint-plugin-jsonc')
      }
    }
  ]
}
