import fs from 'fs'
import path from 'path'
import type { SettingsVueI18nLocaleDir } from '../../lib/types'
import type { RuleTester } from 'eslint'

export function getTestCasesFromFixtures(testOptions: {
  cwd: string
  options?: unknown[]
  localeDir?: SettingsVueI18nLocaleDir
  parserOptions?: RuleTester.ValidTestCase['parserOptions']
}): IterableIterator<RuleTester.ValidTestCase>
export function getTestCasesFromFixtures(
  testOptions: {
    cwd: string
    options?: unknown[]
    localeDir?: SettingsVueI18nLocaleDir
    parserOptions?: RuleTester.ValidTestCase['parserOptions']
  },
  outputs: {
    [file: string]:
      | Omit<RuleTester.InvalidTestCase, keyof RuleTester.ValidTestCase>
      | boolean
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
      | boolean
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
function* extractTargetFiles(dir: string): IterableIterator<{
  filename: string
  relative: string
  parser: string | undefined
}> {
  for (const relative of fs.readdirSync(dir)) {
    if (relative === 'node_modules' || relative === '.eslintrc.js') {
      continue
    }
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
