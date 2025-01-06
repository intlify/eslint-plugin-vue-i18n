/**
 * @fileoverview Update docs headers script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-docs-headers.js
 */
import { type Options, format } from 'prettier'
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load } from 'js-yaml'
import type { RuleInfo } from './lib/rules'
import { getRules } from './lib/rules'
import { getNewVersion } from './lib/changesets-util'
const PLACE_HOLDER = /#[^\n]*\n+> .+\n+(?:- .+\n)*\n*/u

const prettierrc = load(
  readFileSync(join(__dirname, '../.prettierrc.yaml'), 'utf8')
) as Options

async function pickSince(content: string): Promise<string | null> {
  const fileIntro = /^---\n(?<content>[\s\S]+?)---\n*/u.exec(content)
  if (fileIntro) {
    const since = /since: "?(?<version>v\d+\.\d+\.\d+)"?/u.exec(
      fileIntro.groups!.content
    )
    if (since) {
      return since.groups!.version
    }
  }
  if (process.env.IN_VERSION_CI_SCRIPT) {
    return getNewVersion().then(v => `v${v}`)
  }
  return null
}

class DocFile {
  private rule: RuleInfo
  private filePath: string
  private content: string
  private since: string | null = null
  constructor(rule: RuleInfo) {
    this.rule = rule
    this.filePath = join(__dirname, `../docs/rules/${rule.name}.md`)
    this.content = readFileSync(this.filePath, 'utf8')
  }

  async init() {
    this.since = await pickSince(this.content)
    return this
  }

  async write() {
    writeFileSync(
      this.filePath,
      await format(this.content, {
        filepath: this.filePath,
        ...prettierrc
      })
    )
  }
  updateFileIntro() {
    const rule = this.rule

    const fileIntro = {
      // pageClass: 'rule-details',
      // sidebarDepth: 0,
      title: `'${rule.id}'`,
      description: rule.description,
      ...(this.since ? { since: this.since } : {})
    }
    const computed = `---\n${Object.entries(fileIntro)
      .map(item => `${item[0]}: ${item[1]}`)
      .join('\n')}\n---\n\n`

    const fileIntroPattern = /^---\n(.*\n)+?---\n*/g

    if (fileIntroPattern.test(this.content)) {
      this.content = this.content.replace(fileIntroPattern, computed)
    } else {
      this.content = `${computed}${this.content.trim()}\n`
    }

    return this
  }

  updateHeader() {
    const rule = this.rule
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
        '- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.'
      )
    }

    if (rule.fixable) {
      headerLines.push(
        '- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.'
      )
    }
    headerLines.push('', '')

    this.content = this.content.replace(PLACE_HOLDER, headerLines.join('\n'))

    return this
  }

  updateCodeBlocks() {
    const rule = this.rule
    this.content = this.content
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
    return this
  }

  updateFooter() {
    const { name } = this.rule
    const footerPattern = /## (?::mag: Implementation|:rocket: Version).+$/s
    const footer = `${
      this.since
        ? `## :rocket: Version

This rule was introduced in \`@intlify/eslint-plugin-vue-i18n\` ${this.since}

`
        : ''
    }## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/${name}.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/${name}.ts)
`
    if (footerPattern.test(this.content)) {
      this.content = this.content.replace(footerPattern, footer)
    } else {
      this.content = `${this.content.trim()}\n\n${footer}`
    }

    return this
  }
}

export async function update(): Promise<void> {
  for (const rule of await getRules()) {
    const doc = await new DocFile(rule).init()
    await doc
      .updateFileIntro()
      .updateHeader()
      .updateCodeBlocks()
      .updateFooter()
      .write()
  }
}
