/**
 * @fileoverview Update recommended rules
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-recommended-rules.js
 */
'use stricut'

const { writeFileSync } = require('fs')
const { resolve } = require('path')
const rules = require('./lib/rules')
const { format } = require('./lib/utils')

// recommended.js
writeFileSync(
  resolve(__dirname, '../lib/configs/recommended.js'),
  format(`/** DON'T EDIT THIS FILE; was created by scripts. */
'use strict'

module.exports = {
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true
  },
  plugins: ['vue-i18n'],
  rules: {
    ${rules.filter(rule => rule.recommended)
    .map(rule => `'${rule.id}': 'error',`)
    .join('\n        ')}
  },
}`)
)
