module.exports = {
  root: true,
  env: {
    node: true,
    mocha: true
  },
  extends: [
    'plugin:vue-libs/recommended',
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
    'vue/multi-word-component-names': 'off'
  },
  overrides: [
    {
      files: ['*.ts'],
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
