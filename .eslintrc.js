'use strict'

module.exports = {
  root: true,
  env: {
    node: true,
    mocha: true
  },
  extends: [
    'plugin:vue-libs/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'prettier/vue'
  ],
  plugins: [],
  parserOptions: {
    ecmaVersion: 2015
  },
  rules: {
    'object-shorthand': 'error'
  }
}
