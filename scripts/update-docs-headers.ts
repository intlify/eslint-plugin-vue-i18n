/**
 * @fileoverview Update docs headers script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-docs-headers.js
 */
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import rules from './lib/rules'
const PLACE_HOLDER = /^#[^\n]*\n+> .+\n+(?:- .+\n)*\n*/u

for (const rule of rules) {
  const filePath = join(__dirname, `../docs/rules/${rule.name}.md`)
  const headerLines = [`# ${rule.id}`, '', `> ${rule.description}`]

  if (rule.recommended || rule.deprecated || rule.fixable) {
    headerLines.push('')
  }

  if (rule.deprecated) {
    if (rule.replacedBy) {
      headerLines.push(
        `- :warning:️ This rule was **deprecated** and replaced by ${rule.replacedBy
          .map(id => `[${id}](${id}.md) rule`)
          .join(', ')}.`
      )
    } else {
      headerLines.push(`- :warning:️ This rule was **deprecated**.`)
    }
  } else if (rule.recommended) {
    headerLines.push(
      '- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` property in a configuration file enables this rule.'
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
      .replace(/<eslint-code-block(.*?)>/gs, (_ignore, attrs) => {
        attrs = attrs.replace(/\bfix\b/g, '').trim()
        return `<eslint-code-block${rule.fixable ? ' fix' : ''}${
          attrs ? ` ${attrs}` : ''
        }>`
      })
      .replace(
        /\n+(<(?:eslint-code-block|resource-group)([\s\S]*?)>)\n+/gm,
        '\n\n$1\n\n'
      )
      .replace(
        /\n+<\/(eslint-code-block|resource-group)\s*>\n+/gm,
        '\n\n</$1>\n\n'
      )
  )
}
