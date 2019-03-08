/**
 * @fileoverview Utility script library
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/lib/utils.js
 */
'use strict'

const { readdirSync } = require('fs')
const { basename } = require('path')
const { CLIEngine } = require('eslint')
const linter = new CLIEngine({ fix: true })

function format (text) {
  const lintResult = linter.executeOnText(text)
  return lintResult.results[0].output || text
}

function createIndex (dirPath) {
  const dirName = basename(dirPath)
  return format(`/** DON'T EDIT THIS FILE; was created by scripts. */
  'use strict'

  module.exports = {
    ${readdirSync(dirPath)
    .map(file => basename(file, '.js'))
    .map(id => `'${id}': require('./${dirName}/${id}'),`)
    .join('\n    ')}
  }
  `)
}

module.exports = {
  createIndex,
  format
}
