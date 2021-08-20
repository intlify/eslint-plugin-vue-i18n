import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { ESLint } from '../../scripts/lib/eslint-compat'
import base = require('../../lib/configs/base')
import plugin = require('../../lib/index')
import type { SettingsVueI18nLocaleDir } from '../../lib/types'
import { SourceCodeFixer } from './source-code-fixer'
import type { RuleTester } from 'eslint'

function buildBaseConfigPath() {
  const configPath = path.join(
    __dirname,
    '../../node_modules/@intlify/eslint-plugin-vue-i18n/.temp-test/base-config.json'
  )
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(base, null, 2), 'utf8')

  fs.writeFileSync(
    path.join(
      __dirname,
      '../../node_modules/@intlify/eslint-plugin-vue-i18n/index.js'
    ),
    '',
    'utf8'
  )
  return configPath
}

export const baseConfigPath = buildBaseConfigPath()

export function getTestCasesFromFixtures(testOptions: {
  cwd: string
  options?: unknown[]
  localeDir?: SettingsVueI18nLocaleDir
}): IterableIterator<RuleTester.ValidTestCase>
export function getTestCasesFromFixtures(
  testOptions: {
    cwd: string
    options?: unknown[]
    localeDir?: SettingsVueI18nLocaleDir
  },
  outputs: {
    [file: string]:
      | Omit<RuleTester.InvalidTestCase, keyof RuleTester.ValidTestCase>
      | true
  }
): IterableIterator<RuleTester.InvalidTestCase>
export function* getTestCasesFromFixtures(
  testOptions: {
    cwd: string
    options?: unknown[]
    localeDir?: SettingsVueI18nLocaleDir
  },
  outputs?: {
    [file: string]:
      | Omit<RuleTester.InvalidTestCase, keyof RuleTester.ValidTestCase>
      | true
  }
): IterableIterator<RuleTester.ValidTestCase | RuleTester.InvalidTestCase> {
  if (!testOptions) {
    return
  }
  for (const { filename, relative, parser } of extractTargetFiles(
    testOptions.cwd
  )) {
    const data: RuleTester.ValidTestCase = {
      code: fs.readFileSync(filename, 'utf8'),
      filename,
      options: testOptions.options || [],
      parser,
      parserOptions: {},
      settings: {
        'vue-i18n': {
          localeDir: testOptions.localeDir,
          cwd: testOptions.cwd
        }
      }
    }
    if (outputs) {
      const output = outputs[relative]
      if (!output) {
        throw new Error(
          `${relative} output is not found. Specify \`'${relative}': true\` if there are no errors in the file.`
        )
      }
      if (output === true) {
        continue
      }
      Object.assign(data, output)
    }
    yield data
  }
}

const PARSERS = {
  '.js': undefined,
  '.vue': require.resolve('vue-eslint-parser'),
  '.json': require.resolve('jsonc-eslint-parser'),
  '.json5': require.resolve('jsonc-eslint-parser'),
  '.yaml': require.resolve('yaml-eslint-parser'),
  '.yml': require.resolve('yaml-eslint-parser')
}
function* extractTargetFiles(
  dir: string
): IterableIterator<{
  filename: string
  relative: string
  parser: string | undefined
}> {
  for (const relative of fs.readdirSync(dir)) {
    const filename = path.join(dir, relative)
    const ext = path.extname(relative)
    if (
      ext === '.js' ||
      ext === '.vue' ||
      ext === '.json' ||
      ext === '.json5' ||
      ext === '.yaml' ||
      ext === '.yml'
    ) {
      yield { filename, relative, parser: PARSERS[ext] }
      continue
    }
    if (relative === 'node_modules') {
      continue
    }
    if (fs.statSync(filename).isDirectory()) {
      for (const f of extractTargetFiles(filename)) {
        yield {
          filename: f.filename,
          relative: path.join(relative, f.relative),
          parser: f.parser
        }
      }
    }
  }
}
/**
 * @deprecated
 */
export async function testOnFixtures(
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
): Promise<void> {
  const originalCwd = process.cwd()
  try {
    process.chdir(testOptions.cwd)
    const eslint = new ESLint(
      testOptions.useEslintrc
        ? {
            cwd: testOptions.cwd,
            useEslintrc: true,
            plugins: {
              '@intlify/eslint-plugin-vue-i18n': plugin
            },
            extensions: ['.js', '.vue', '.json', '.json5', '.yaml', '.yml']
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
            overrideConfig: {
              parserOptions: {
                ecmaVersion: 2018,
                sourceType: 'module'
              },
              rules: {
                [testOptions.ruleName]: [
                  'error',
                  ...(testOptions.options || [])
                ]
              }
            },
            extensions: ['.js', '.vue', '.json', '.json5', '.yaml', '.yml'],
            plugins: {
              '@intlify/eslint-plugin-vue-i18n': plugin
            }
          }
    )

    const messageResults = await eslint.lintFiles(['.'])
    const filePaths = Object.keys(expectedMessages).map(file =>
      path.join(testOptions.cwd, file)
    )
    for (const lintResult of messageResults) {
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
        messageResults,
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
    assert.equal(
      messageResults.reduce((s, m) => s + m.errorCount, 0),
      count
    )
  } finally {
    process.chdir(originalCwd)
  }
}

function getResult(
  ruleName: string,
  messageResults: ESLint.LintResult[],
  fullPath: string,
  options?: { messageOnly?: boolean }
): {
  output?: string | null
  errors:
    | string[]
    | {
        message: string
        line: number
        suggestions?: { desc: string; output: string }[]
      }[]
} {
  const result = messageResults.find(result => result.filePath === fullPath)
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
  const sortedMessages = [...result.messages].sort(
    (problemA, problemB) =>
      problemA.line - problemB.line ||
      problemA.column - problemB.column ||
      (problemA.endLine ?? 0) - (problemB.endLine ?? 0) ||
      (problemA.endColumn ?? 0) - (problemB.endColumn ?? 0) ||
      compareStr(problemA.ruleId || '', problemB.ruleId || '') ||
      compareStr(problemA.messageId || '', problemB.messageId || '') ||
      compareStr(problemA.message, problemB.message)
  )
  return {
    ...(rule.meta.fixable != null
      ? {
          output: (() => {
            const output = SourceCodeFixer.applyFixes(
              result.source!,
              sortedMessages
            ).output
            return output === result.source ? null : output
          })()
        }
      : {}),
    errors: sortedMessages.map(message => {
      assert.equal(message.ruleId, ruleName)

      return {
        message: message.message,
        line: message.line,
        ...(message.suggestions
          ? {
              suggestions: message.suggestions!.map(suggest => {
                const output = SourceCodeFixer.applyFixes(result.source!, [
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

function compareStr(a: string, b: string) {
  return a > b ? 1 : a < b ? -1 : 0
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
