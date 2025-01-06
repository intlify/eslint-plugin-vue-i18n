/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
  parser: require.resolve('vue-eslint-parser'),
  plugins: ['@intlify/vue-i18n'],
  overrides: [
    {
      files: ['*.json', '*.json5'],
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('jsonc-eslint-parser')
      }
    },
    {
      files: ['*.yaml', '*.yml'],
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('yaml-eslint-parser')
      },
      rules: {
        'no-irregular-whitespace': 'off',
        'spaced-comment': 'off'
      }
    }
  ]
}
