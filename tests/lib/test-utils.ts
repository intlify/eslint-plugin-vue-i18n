import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import type { SettingsVueI18nLocaleDir } from '../../lib/types'
import type { RuleTester } from 'eslint'
import * as vueParser from 'vue-eslint-parser'
import * as jsonParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'
import { satisfies } from 'semver'
import { version } from 'eslint/package.json'

type LanguageOptions = {
  parser: object
}

export function getRuleTesterTestCaseOptions(
  root: string,
  filebaseName: string = 'test'
) {
  return {
    json(messageSyntaxVersion: string | null = '^9.0.0') {
      return {
        languageOptions: { parser: jsonParser },
        filename: join(root, `${filebaseName}.json`),
        settings: {
          'vue-i18n': {
            localeDir: {
              pattern: `${root}/*.{json,yaml,yml}`
            },
            messageSyntaxVersion
          }
        }
      }
    },
    yaml(messageSyntaxVersion: string | null = '^9.0.0') {
      return {
        languageOptions: { parser: yamlParser },
        filename: join(root, `${filebaseName}.yaml`),
        settings: {
          'vue-i18n': {
            localeDir: {
              pattern: `${root}/*.{json,yaml,yml}`
            },
            messageSyntaxVersion
          }
        }
      }
    },
    vue(messageSyntaxVersion: string | null = '^9.0.0') {
      return {
        languageOptions: { parser: vueParser },
        filename: join(root, `${filebaseName}.vue`),
        settings: {
          'vue-i18n': {
            messageSyntaxVersion
          }
        }
      }
    }
  }
}

export function getTestCasesFromFixtures(testOptions: {
  eslint?: string
  cwd: string
  options?: unknown[]
  localeDir?: SettingsVueI18nLocaleDir
  languageOptions?: LanguageOptions
  only?: boolean
}): IterableIterator<RuleTester.ValidTestCase>
export function getTestCasesFromFixtures(
  testOptions: {
    eslint?: string
    cwd: string
    options?: unknown[]
    localeDir?: SettingsVueI18nLocaleDir
    languageOptions?: LanguageOptions
    only?: boolean
  },
  outputs: {
    [file: string]:
      | Omit<RuleTester.InvalidTestCase, keyof RuleTester.ValidTestCase>
      | boolean
  }
): IterableIterator<RuleTester.InvalidTestCase>
export function* getTestCasesFromFixtures(
  testOptions: {
    eslint?: string
    cwd: string
    options?: unknown[]
    localeDir?: SettingsVueI18nLocaleDir
    languageOptions?: LanguageOptions
    only?: boolean
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
  if (testOptions.eslint && !satisfies(version, testOptions.eslint)) {
    return
  }
  for (const { filename, relative, parser } of extractTargetFiles(
    testOptions.cwd
  )) {
    const data: RuleTester.ValidTestCase = {
      code: readFileSync(filename, 'utf8'),
      filename,
      options: testOptions.options || [],
      // @ts-expect-error -- Type error for eslint v9
      languageOptions: {
        ...testOptions.languageOptions,
        ...(parser ? { parser } : {})
      },
      settings: {
        'vue-i18n': {
          localeDir: testOptions.localeDir,
          cwd: testOptions.cwd
        }
      },
      ...(testOptions.only ? { only: true } : {})
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

const PARSERS: Record<string, object | undefined> = {
  '.js': undefined,
  '.vue': vueParser,
  '.json': jsonParser,
  '.json5': jsonParser,
  '.yaml': yamlParser,
  '.yml': yamlParser
}
function* extractTargetFiles(dir: string): IterableIterator<{
  filename: string
  relative: string
  parser: object | undefined
}> {
  for (const relative of readdirSync(dir)) {
    if (relative === 'node_modules' || relative === '.eslintrc.js') {
      continue
    }
    const filename = join(dir, relative)
    const ext = extname(relative)
    if (PARSERS[ext]) {
      yield { filename, relative, parser: PARSERS[ext] }
      continue
    }
    if (statSync(filename).isDirectory()) {
      for (const f of extractTargetFiles(filename)) {
        yield {
          filename: f.filename,
          relative: join(relative, f.relative),
          parser: f.parser
        }
      }
    }
  }
}
