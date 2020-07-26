/**
 * @fileoverview Update script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update.js
 */
'use stricut'

const { writeFileSync } = require('fs')
const { resolve } = require('path')
const { createIndex } = require('./lib/utils')

// docs.
require('./update-docs-headers')
require('./update-docs-index')

// recommended rules.
require('./update-recommended-rules')

// indices.
for (const pairs of [
  [resolve(__dirname, '../lib/configs')],
  [resolve(__dirname, '../lib/rules')],
  [resolve(__dirname, '../lib/utils')]
]) {
  const [dirPath, prefix] = pairs
  writeFileSync(`${dirPath}.js`, createIndex(dirPath, prefix))
}
