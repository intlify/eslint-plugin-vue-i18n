/**
 * @author Yosuke Ota
 */
import { join } from 'node:path'

import { RuleTester } from '../eslint-compat'

import rule from '../../../lib/rules/key-format-style'
import type { SettingsVueI18nLocaleDirObject } from '../../../lib/types'
import * as vueParser from 'vue-eslint-parser'
import * as jsonParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

const fileLocalesRoot = join(__dirname, '../../fixtures/key-format-style/file')
const keyLocalesRoot = join(__dirname, '../../fixtures/key-format-style/key')

const options = {
  json: {
    file: {
      languageOptions: { parser: jsonParser },
      filename: join(fileLocalesRoot, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: `${fileLocalesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    key: {
      languageOptions: { parser: jsonParser },
      filename: join(keyLocalesRoot, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: {
            pattern: `${keyLocalesRoot}/*.{json,yaml,yml}`,
            localeKey: 'key'
          } as SettingsVueI18nLocaleDirObject
        }
      }
    }
  },
  yaml: {
    file: {
      languageOptions: { parser: yamlParser },
      filename: join(fileLocalesRoot, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: `${fileLocalesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    key: {
      languageOptions: { parser: yamlParser },
      filename: join(keyLocalesRoot, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: {
            pattern: `${keyLocalesRoot}/*.{json,yaml,yml}`,
            localeKey: 'key'
          } as SettingsVueI18nLocaleDirObject
        }
      }
    }
  }
}

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('key-format-style', rule as never, {
  valid: [
    {
      code: `
      foo:
        bar: baz
      `,
      ...options.yaml.file
    },
    {
      code: `
      camelCase:
        fooBar: kebab-value
      `,
      ...options.yaml.file
    },
    {
      code: `{
        "camelCase": {
          "fooBar": "kebab-value"
        }
      }
      `,
      ...options.json.file
    },
    {
      code: `
      en-US:
        camelCase:
          fooBar: kebab-value
      `,
      ...options.yaml.key
    },
    {
      code: `{
        "en-US": {
          "camelCase": {
            "fooBar": "kebab-value"
          }
        }
      }
      `,
      ...options.json.key
    },
    {
      code: `
      kebab-case:
        foo-bar: camelValue
      `,
      ...options.yaml.file,
      options: ['kebab-case']
    },
    {
      code: `{
        "kebab-case": {
          "foo-bar": "camelValue"
        }
      }
      `,
      ...options.json.file,
      options: ['kebab-case']
    },
    {
      code: `
      lowercase:
        foobar: kebab-value
      `,
      ...options.yaml.file
    },
    {
      code: `{
        "lowercase": {
          "foobar": "kebab-value"
        }
      }
      `,
      ...options.json.file
    },
    {
      code: `
      en-US:
        lowercase:
          foobar: kebab-value
      `,
      ...options.yaml.key
    },
    {
      code: `{
        "en-US": {
          "lowercase": {
            "foobar": "kebab-value"
          }
        }
      }
      `,
      ...options.json.key
    },
    {
      code: `
      snake_case:
        foo_bar: camelValue
      `,
      ...options.yaml.file,
      options: ['snake_case']
    },
    {
      code: `{
        "snake_case": {
          "foo_bar": "camelValue"
        }
      }
      `,
      ...options.json.file,
      options: ['snake_case']
    },
    {
      code: `
      - foo
      `,
      ...options.yaml.file,
      options: ['camelCase', { allowArray: true }]
    },
    {
      code: `
      en-US:
        - foo
      `,
      ...options.yaml.key,
      options: ['camelCase', { allowArray: true }]
    },
    {
      code: `
      ["foo"]
      `,
      ...options.json.file,
      options: ['camelCase', { allowArray: true }]
    },
    {
      code: `
      {"en-US": ["foo"]}`,
      ...options.json.key,
      options: ['camelCase', { allowArray: true }]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "fooBar": "baz"
      }
      </i18n>
      <i18n locale="ja" lang="yaml">
      "fooBar": "baz"
      </i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en-US": {
          "fooBar": "baz",
        }
      }
      </i18n>
      <template></template>
      <script></script>`
    },
    {
      code: `{
        "camelCase.camelCase": {
          "fooBar": "kebab-value"
        }
      }
      `,
      ...options.json.file,
      options: ['camelCase', { splitByDots: true }]
    }
  ],

  invalid: [
    {
      code: `
      foo-bar: baz
      `,
      ...options.yaml.file,
      errors: [
        {
          message: '"foo-bar" is not camelCase',
          line: 2
        }
      ]
    },
    {
      code: `
      en-US:
        foo-bar: baz
      `,
      ...options.yaml.key,
      errors: [
        {
          message: '"foo-bar" is not camelCase',
          line: 3
        }
      ]
    },
    {
      code: `
      {"foo-bar": "baz"}
      `,
      ...options.json.file,
      errors: [
        {
          message: '"foo-bar" is not camelCase',
          line: 2
        }
      ]
    },
    {
      code: `
      {"en-US": {
        "foo-bar": "baz"
      }}`,
      ...options.json.key,
      errors: [
        {
          message: '"foo-bar" is not camelCase',
          line: 3
        }
      ]
    },
    {
      code: `
      kebab-case:
        snake_case: camelCase
      `,
      ...options.yaml.file,
      options: ['camelCase'],
      errors: [
        {
          message: '"kebab-case" is not camelCase',
          line: 2
        },
        {
          message: '"snake_case" is not camelCase',
          line: 3
        }
      ]
    },
    {
      code: `{
        "kebab-case": {
          "snake_case": "camelCase"
        }
      }
      `,
      ...options.json.file,
      options: ['camelCase'],
      errors: [
        {
          message: '"kebab-case" is not camelCase',
          line: 2
        },
        {
          message: '"snake_case" is not camelCase',
          line: 3
        }
      ]
    },
    {
      code: `
      camelCase:
        snake_case: kebab-case
      `,
      ...options.yaml.file,
      options: ['kebab-case'],
      errors: [
        {
          message: '"camelCase" is not kebab-case',
          line: 2
        },
        {
          message: '"snake_case" is not kebab-case',
          line: 3
        }
      ]
    },
    {
      code: `{
        "camelCase": {
          "snake_case": "kebab-case"
        }
      }
      `,
      ...options.json.file,
      options: ['kebab-case'],
      errors: [
        {
          message: '"camelCase" is not kebab-case',
          line: 2
        },
        {
          message: '"snake_case" is not kebab-case',
          line: 3
        }
      ]
    },
    {
      code: `
      kebab-case:
        camelCase: snake_case
      `,
      ...options.yaml.file,
      options: ['snake_case'],
      errors: [
        {
          message: '"kebab-case" is not snake_case',
          line: 2
        },
        {
          message: '"camelCase" is not snake_case',
          line: 3
        }
      ]
    },
    {
      code: `{
        "kebab-case": {
          "camelCase": "snake_case"
        }
      }
      `,
      ...options.json.file,
      options: ['snake_case'],
      errors: [
        {
          message: '"kebab-case" is not snake_case',
          line: 2
        },
        {
          message: '"camelCase" is not snake_case',
          line: 3
        }
      ]
    },
    {
      code: `
      foo-bar: baz
      `,
      ...options.yaml.file,
      options: ['lowercase'],
      errors: [
        {
          message: '"foo-bar" is not lowercase',
          line: 2
        }
      ]
    },
    {
      code: `
      en-US:
        foo-bar: baz
      `,
      ...options.yaml.key,
      options: ['lowercase'],
      errors: [
        {
          message: '"foo-bar" is not lowercase',
          line: 3
        }
      ]
    },
    {
      code: `
      {"foo-bar": "baz"}
      `,
      ...options.json.file,
      options: ['lowercase'],
      errors: [
        {
          message: '"foo-bar" is not lowercase',
          line: 2
        }
      ]
    },
    {
      code: `
      {"en-US": {
        "foo-bar": "baz"
      }}`,
      ...options.json.key,
      options: ['lowercase'],
      errors: [
        {
          message: '"foo-bar" is not lowercase',
          line: 3
        }
      ]
    },
    {
      code: `
      kebab-case:
        snake_case: camelCase
      `,
      ...options.yaml.file,
      options: ['lowercase'],
      errors: [
        {
          message: '"kebab-case" is not lowercase',
          line: 2
        },
        {
          message: '"snake_case" is not lowercase',
          line: 3
        }
      ]
    },
    {
      code: `{
        "kebab-case": {
          "snake_case": "camelCase"
        }
      }
      `,
      ...options.json.file,
      options: ['lowercase'],
      errors: [
        {
          message: '"kebab-case" is not lowercase',
          line: 2
        },
        {
          message: '"snake_case" is not lowercase',
          line: 3
        }
      ]
    },
    {
      code: `
      SCREAMING_SNAKE_CASE:
        PascalCase: camelCase
      `,
      ...options.yaml.file,
      options: ['lowercase'],
      errors: [
        {
          message: '"SCREAMING_SNAKE_CASE" is not lowercase',
          line: 2
        },
        {
          message: '"PascalCase" is not lowercase',
          line: 3
        }
      ]
    },
    {
      code: `{
        "SCREAMING_SNAKE_CASE": {
          "PascalCase": "camelCase"
        }
      }
      `,
      ...options.json.file,
      options: ['lowercase'],
      errors: [
        {
          message: '"SCREAMING_SNAKE_CASE" is not lowercase',
          line: 2
        },
        {
          message: '"PascalCase" is not lowercase',
          line: 3
        }
      ]
    },
    {
      code: `
      - foo
      `,
      ...options.yaml.file,
      errors: [
        {
          message: 'Unexpected array element',
          line: 2
        }
      ]
    },
    {
      code: `
      en-US:
        - foo
      `,
      ...options.yaml.key,
      errors: [
        {
          message: 'Unexpected array element',
          line: 3
        }
      ]
    },
    {
      code: `
      ["foo"]
      `,
      ...options.json.file,
      errors: [
        {
          message: 'Unexpected array element',
          line: 2
        }
      ]
    },
    {
      code: `
      {"en-US": ["foo"]}`,
      ...options.json.key,
      errors: [
        {
          message: 'Unexpected array element',
          line: 2
        }
      ]
    },
    {
      code: `1: foo`,
      ...options.yaml.file,
      errors: [
        {
          message: '"1" is not camelCase',
          line: 1
        }
      ]
    },
    {
      code: `
      ? {kebab-case: value}
      : foo
      ? [{kebab-case: value}, 2]
      : foo
      `,
      ...options.yaml.file,
      errors: [
        {
          message: 'Unexpected object key. Use camelCase string key instead',
          line: 2
        },
        {
          message: 'Unexpected object key. Use camelCase string key instead',
          line: 4
        }
      ]
    },

    // SFCs
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "foo-bar": "baz"
      }
      </i18n>
      <i18n locale="ja" lang="yaml">
      foo-bar: "baz"
      </i18n>
      <template></template>
      <script></script>`,
      errors: [
        {
          message: '"foo-bar" is not camelCase',
          line: 4
        },
        {
          message: '"foo-bar" is not camelCase',
          line: 8
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en-US": {
          "foo-bar": "baz",
        }
      }
      </i18n>
      <template></template>
      <script></script>`,
      errors: [
        {
          message: '"foo-bar" is not camelCase',
          line: 5
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en-US": {
          "foo-bar": "baz",
          "fooBar": "baz",
          "foo_bar": "baz",
          "FOO_BAR": "baz",
        }
      }
      </i18n>
      <template></template>
      <script></script>`,
      errors: [
        '"foo-bar" is not camelCase',
        '"foo_bar" is not camelCase',
        '"FOO_BAR" is not camelCase'
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en-US": {
          "foo-bar": "baz",
          "fooBar": "baz",
          "foo_bar": "baz",
          "FOO_BAR": "baz",
        }
      }
      </i18n>
      <template></template>
      <script></script>`,
      options: ['SCREAMING_SNAKE_CASE'],
      errors: [
        '"foo-bar" is not SCREAMING_SNAKE_CASE',
        '"fooBar" is not SCREAMING_SNAKE_CASE',
        '"foo_bar" is not SCREAMING_SNAKE_CASE'
      ]
    },
    {
      code: `{
        "kebab-case1.kebab-case2": {
          "foo-bar": "kebab-value"
        }
      }
      `,
      ...options.json.file,
      options: ['camelCase', { splitByDots: true }],
      errors: [
        {
          message: '"kebab-case1" is not camelCase',
          line: 2,
          column: 10,
          endColumn: 21
        },
        {
          message: '"kebab-case" is not camelCase',
          line: 2,
          column: 22,
          endColumn: 33
        },
        {
          message: '"foo-bar" is not camelCase',
          line: 3,
          column: 11,
          endColumn: 20
        }
      ]
    }
  ]
})
