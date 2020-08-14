export = {
  parser: require.resolve('vue-eslint-parser'),
  plugins: ['@intlify/vue-i18n'],
  overrides: [
    {
      files: ['*.json', '*.json5'],
      // TODO: If you do not use vue-eslint-parser, you will get an error in vue rules.
      // see https://github.com/vuejs/eslint-plugin-vue/pull/1262
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('jsonc-eslint-parser')
      }
    },
    {
      files: ['*.yaml', '*.yml'],
      // TODO: If you do not use vue-eslint-parser, you will get an error in vue rules.
      // see https://github.com/vuejs/eslint-plugin-vue/pull/1262
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('yaml-eslint-parser')
      },
      rules: {
        // ESLint core rules known to cause problems with YAML.
        // https://github.com/ota-meshi/eslint-plugin-yml/blob/4e468109b9d2f4376b8d4d1221adba27c6ee04b2/src/configs/base.ts#L7-L11
        'no-irregular-whitespace': 'off',
        'spaced-comment': 'off'
      }
    }
  ]
}
