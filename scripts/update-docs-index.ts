/**
 * @fileoverview Update docs index script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-docs-index.js
 */
import { type Options, format } from 'prettier'
import { writeFileSync, readFileSync } from 'fs'
import { join, resolve } from 'node:path'
import { load } from 'js-yaml'
import type { RuleInfo } from './lib/rules'
import { withCategories } from './lib/rules'

const prettierrc = load(
  readFileSync(join(__dirname, '../.prettierrc.yaml'), 'utf8')
) as Options

function toTableRow(rule: RuleInfo) {
  const mark = `${rule.recommended ? ':star:' : ''}${
    rule.fixable ? ':black_nib:' : ''
  }`
  const link = `[@intlify/vue-i18n/<wbr>${rule.name}](./rules/${rule.name}.html)`
  const description = rule.description || '(no description)'
  return `| ${link} | ${description} | ${mark} |`
}

function toCategorySection({
  category,
  rules
}: {
  category: string
  rules: RuleInfo[]
}) {
  return `## ${category}

<!--prettier-ignore-->
| Rule ID | Description |    |
|:--------|:------------|:---|
${rules.map(toTableRow).join('\n')}
`
}

const filePath = resolve(__dirname, '../docs/rules/index.md')
const content = `# Available Rules

- :star: mark: the rule which is enabled by \`plugin:@intlify/vue-i18n/recommended\` preset.
- :black_nib: mark: the rule which is fixable by \`eslint --fix\` command.

${withCategories.map(toCategorySection).join('\n')}
`
writeFileSync(filePath, format(content, { filepath: filePath, ...prettierrc }))
