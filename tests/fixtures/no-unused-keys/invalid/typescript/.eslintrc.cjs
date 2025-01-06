module.exports = {
  root: true,
  extends: ['plugin:vue-i18n-ex/base'],
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  rules: {
    'vue-i18n-ex/no-unused-keys': ["error", {
      "src": "./src",
      "extensions": [".tsx", ".ts", ".vue"],
      "enableFix": true,
    }]
  },
  settings: {
    'vue-i18n-ex': {
      localeDir: {
        pattern: `./locales/*.{json,yaml,yml}`,
        localeKey: 'file'
      }
    }
  },
  overrides: [
    {
      files: ['*.json', '*.json5'],
      extends: ['plugin:vue-i18n-ex/base'],
    },
    {
      files: ['*.yaml', '*.yml'],
      extends: ['plugin:vue-i18n-ex/base'],
    }
  ]
}
