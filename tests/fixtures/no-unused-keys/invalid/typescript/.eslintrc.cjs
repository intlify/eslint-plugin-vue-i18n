module.exports = {
  root: true,
  extends: ['plugin:@intlify/vue-i18n/base'],
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  rules: {
    '@intlify/vue-i18n/no-unused-keys': ["error", {
      "src": "./src",
      "extensions": [".tsx", ".ts", ".vue"],
      "enableFix": true,
    }]
  },
  settings: {
    'vue-i18n': {
      localeDir: {
        pattern: `./locales/*.{json,yaml,yml}`,
        localeKey: 'file'
      }
    }
  },
  overrides: [
    {
      files: ['*.json', '*.json5'],
      extends: ['plugin:@intlify/vue-i18n/base'],
    },
    {
      files: ['*.yaml', '*.yml'],
      extends: ['plugin:@intlify/vue-i18n/base'],
    }
  ]
}
