import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { CLIEngine } from 'eslint'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import linter = require('eslint/lib/linter')
import base = require('../../lib/configs/base')
import plugin = require('../../lib/index')
import { SettingsVueI18nLocaleDir } from '../../lib/types'
const { SourceCodeFixer } = linter

function buildBaseConfigPath() {
  const configPath = path.join(
    __dirname,
    '../../node_modules/@intlify/eslint-plugin-vue-i18n/.temp-test/base-config.json'
  )
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(base, null, 2), 'utf8')
  return configPath
}

export const baseConfigPath = buildBaseConfigPath()

export function testOnFixtures(
  testOptions: {
    cwd: string
    ruleName: string
  } & (
    | {
        localeDir?: SettingsVueI18nLocaleDir
        options?: unknown[]
        useEslintrc?: false
      }
    | {
        useEslintrc: true
      }
  ),
  expectedMessages: {
    [file: string]: {
      output?: string | null
      errors:
        | string[]
        | {
            message: string
            line: number
            suggestions?: { desc: string; output: string }[]
          }[]
    }
  },
  assertOptions?: { messageOnly?: boolean }
): void {
  const originalCwd = process.cwd()
  try {
    process.chdir(testOptions.cwd)
    const linter = new CLIEngine(
      testOptions.useEslintrc
        ? {
            cwd: testOptions.cwd,
            useEslintrc: true
          }
        : {
            cwd: testOptions.cwd,
            baseConfig: {
              extends: [baseConfigPath],
              settings: {
                'vue-i18n': {
                  localeDir: testOptions.localeDir
                }
              }
            },
            useEslintrc: false,
            parserOptions: {
              ecmaVersion: 2020,
              sourceType: 'module'
            },
            rules: {
              [testOptions.ruleName]: ['error', ...(testOptions.options || [])]
            },
            extensions: ['.js', '.vue', '.json', '.json5', '.yaml', '.yml']
          }
    )
    linter.addPlugin('@intlify/vue-i18n', plugin)

    const messages = linter.executeOnFiles(['.'])
    const filePaths = Object.keys(expectedMessages).map(file =>
      path.join(testOptions.cwd, file)
    )
    for (const lintResult of messages.results) {
      if (lintResult.errorCount > 0) {
        if (!filePaths.includes(lintResult.filePath)) {
          assert.fail(
            'Expected ' +
              lintResult.filePath.replace(testOptions.cwd, '') +
              ' values are required.'
          )
        }
      }
    }

    let count = 0
    for (const filePath of Object.keys(expectedMessages)) {
      const fileMessages = getResult(
        testOptions.ruleName,
        messages,
        path.resolve(testOptions.cwd, filePath),
        assertOptions
      )

      assert.strictEqual(
        stringify(fileMessages),
        stringify(expectedMessages[filePath]),
        'Unexpected messages in ' + filePath
      )
      count += fileMessages.errors.length
    }
    assert.equal(messages.errorCount, count)
  } finally {
    process.chdir(originalCwd)
  }
}

function getResult(
  ruleName: string,
  messages: CLIEngine.LintReport,
  fullPath: string,
  options?: { messageOnly?: boolean }
): {
  output?: string
  errors:
    | string[]
    | {
        message: string
        line: number
        suggestions?: { desc: string; output: string }[]
      }[]
} {
  const result = messages.results.find(result => result.filePath === fullPath)
  if (!result) {
    assert.fail('not found lint results at ' + fullPath)
  }
  const messageOnly = options?.messageOnly ?? false
  if (messageOnly) {
    return {
      errors: result.messages.map(message => {
        assert.equal(message.ruleId, ruleName)
        return message.message
      })
    }
  }
  const rule =
    plugin.rules[
      ruleName.replace(/^@intlify\/vue-i18n\//u, '') as 'no-unused-keys'
    ]
  return {
    ...(rule.meta.fixable != null
      ? {
          output: (() => {
            const output = SourceCodeFixer.applyFixes(
              result.source,
              result.messages
            ).output
            return output === result.source ? null : output
          })()
        }
      : {}),
    errors: result.messages.map(message => {
      assert.equal(message.ruleId, ruleName)

      return {
        message: message.message,
        line: message.line,
        ...(message.suggestions
          ? {
              suggestions: message.suggestions!.map(suggest => {
                const output = SourceCodeFixer.applyFixes(result.source, [
                  suggest
                ]).output
                return {
                  desc: suggest.desc,
                  output
                }
              })
            }
          : {})
      }
    })
  }
}

function stringify(obj: unknown) {
  return JSON.stringify(sortKeysObject(obj), null, 2)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortKeysObject(obj: any): unknown {
  if (obj == null) {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(sortKeysObject)
  }
  if (typeof obj !== 'object') {
    return obj
  }
  const res: { [key: string]: unknown } = {}
  for (const key of Object.keys(obj).sort()) {
    res[key] = sortKeysObject(obj[key])
  }
  return res
}
