/**
 * @fileoverview Update docs headers script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-docs-headers.js
 */
'use strict'

const { writeFileSync, readFileSync } = require('fs')
const { join } = require('path')
const rules = require('./lib/rules')
const PLACE_HOLDER = /^#[^\n]*\n+> .+\n+(?:- .+\n)*\n*/u

for (const rule of rules) {
  const filePath = join(__dirname, `../docs/rules/${rule.name}.md`)
  const headerLines = [`# ${rule.id}`, '', `> ${rule.description}`]

  if (rule.recommended || rule.deprecated || rule.fixable) {
    headerLines.push('')
  }

  if (rule.deprecated) {
    headerLines.push(
      `- :warning:️ This rule was **deprecated** and replaced by ${rule.replacedBy
        .map(id => `[${id}](${id}.md) rule`)
        .join(', ')}.`
    )
  } else if (rule.recommended) {
    headerLines.push(
      '- :star: The `"extends": "plugin:vue-i18n/recommended"` property in a configuration file enables this rule.'
    )
  }

  if (rule.fixable) {
    headerLines.push(
      '- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.'
    )
  }
  headerLines.push('', '')

  writeFileSync(
    filePath,
    readFileSync(filePath, 'utf8')
      .replace(PLACE_HOLDER, headerLines.join('\n'))
  )
}
