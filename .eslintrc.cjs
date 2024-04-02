'use strict'

module.exports = {
  root: true,
  env: {
    node: true,
    mocha: true
  },
  extends: [
    'plugin:vue/recommended',
    'plugin:prettier/recommended',
    'plugin:markdown/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    parser: 'espree'
  },
  rules: {
    'object-shorthand': 'error',
    'no-debugger': 'error',
    'vue/multi-word-component-names': 'off',

    'prefer-template': 'error',
    'no-restricted-properties': [
      'error',
      {
        object: 'context',
        property: 'getSourceCode',
        message: 'Use lib/utils/compat.ts'
      },
      {
        object: 'context',
        property: 'getFilename',
        message: 'Use lib/utils/compat.ts'
      },
      {
        object: 'context',
        property: 'getPhysicalFilename',
        message: 'Use lib/utils/compat.ts'
      },
      {
        object: 'context',
        property: 'getCwd',
        message: 'Use lib/utils/compat.ts'
      },
      {
        object: 'context',
        property: 'getScope',
        message: 'Use lib/utils/compat.ts'
      },
      {
        object: 'context',
        property: 'parserServices',
        message: 'Use lib/utils/compat.ts'
      }
    ]
  },
  overrides: [
    {
      files: ['*.ts', '*.mts'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/consistent-type-imports': 'error'
      }
    },
    {
      files: ['**/*.md/*.*'],
      rules: {
        'prettier/prettier': 'off'
      }
    }
  ]
}
