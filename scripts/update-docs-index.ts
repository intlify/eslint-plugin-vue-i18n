/**
 * @fileoverview Update docs index script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-docs-index.js
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import type { RuleInfo } from './lib/rules'
import { withCategories } from './lib/rules'

function toTableRow(rule: RuleInfo) {
  const mark = `${rule.recommended ? ':star:' : ''}${
    rule.fixable ? ':black_nib:' : ''
  }`
  const link = `[@intlify/vue-i18n/<wbr>${rule.name}](./${rule.name}.html)`
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

| Rule ID | Description |    |
|:--------|:------------|:---|
${rules.map(toTableRow).join('\n')}
`
}

writeFileSync(
  resolve(__dirname, '../docs/rules/README.md'),
  `# Available Rules

- :star: mark: the rule which is enabled by \`plugin:@intlify/vue-i18n/recommended\` preset.
- :black_nib: mark: the rule which is fixable by \`eslint --fix\` command.

${withCategories.map(toCategorySection).join('\n')}
`
)
