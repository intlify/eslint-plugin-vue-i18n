const base = require("../../../../../lib/configs/flat/base");
module.exports = [
  ...base,
  {
    files: ['**/*.vue', '*.vue'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  },
  {
    files: ['**/*.ts', '*.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
  },
  {
    rules: {
      "@intlify/vue-i18n/no-unused-keys": [
        "error",
        {
          src: "./src",
          extensions: [".tsx", ".ts", ".vue"],
          enableFix: true,
        },
      ],
    },
    settings: {
      "vue-i18n": {
        localeDir: {
          pattern: `./locales/*.{json,yaml,yml}`,
          localeKey: "file",
        },
      },
    },
  },
];
