/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { join } from 'node:path'
import { RuleTester } from '../eslint-compat'
import { getRuleTesterTestCaseOptions } from '../test-utils'
import rule from '../../../lib/rules/no-deprecated-modulo-syntax'
import * as vueParser from 'vue-eslint-parser'

const FIXTURES_ROOT = join(
  __dirname,
  '../../fixtures/no-deprecated-modulo-syntax'
)

const options = getRuleTesterTestCaseOptions(FIXTURES_ROOT)

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-deprecated-module-syntax', rule as never, {
  valid: [
    // text only
    {
      code: `
      {
        "hello": "world"
      }
      `,
      ...options.json()
    },
    // named interpolation
    {
      code: `
      {
        "hello": "{msg} world"
      }
      `,
      ...options.json()
    },
    // list interpolation
    {
      code: `
      {
        "hello": "{0} world"
      }
      `,
      ...options.json()
    },
    // linked messages
    {
      code: `
      {
        "hello": "@:{'baz'} world"
      }
      `,
      ...options.json()
    },
    // pluralization
    {
      code: `
      {
        "hello": "world1 | world2"
      }
      `,
      ...options.json()
    },
    // yaml
    {
      code: `
        hello: '{msg} world'
      `,
      ...options.yaml()
    },
    // SFC
    {
      code: `
      <i18n lang="json5">
      { hello: "{msg} world" }
      </i18n>
      <i18n lang="yaml">
      hello: '{msg} world'
      </i18n>
      `,
      ...options.vue()
    }
  ],

  invalid: [
    // modulo for json
    {
      code: `{
        "hello": "%{msg} world"
      }
      `,
      ...options.json(),
      output: `{
        "hello": "{msg} world"
      }
      `,
      errors: [
        {
          message:
            'The modulo interpolation must be enforced to named interpolation.',
          line: 2,
          column: 19,
          endLine: 2,
          endColumn: 25
        }
      ]
    },
    // modulo for yaml
    {
      code: `hello: "%{msg} world"
      `,
      ...options.yaml(),
      output: `hello: "{msg} world"
      `,
      errors: [
        {
          message:
            'The modulo interpolation must be enforced to named interpolation.',
          line: 1,
          column: 9,
          endLine: 1,
          endColumn: 15
        }
      ]
    },
    // modulo for SFC
    {
      code: `
      <i18n>
      { "hello": "%{msg} world" }
      </i18n>
      <i18n lang="yaml">
      hello: '%{msg} world'
      </i18n>
      `,
      ...options.vue(),
      output: `
      <i18n>
      { "hello": "{msg} world" }
      </i18n>
      <i18n lang="yaml">
      hello: '{msg} world'
      </i18n>
      `,
      errors: [
        {
          message:
            'The modulo interpolation must be enforced to named interpolation.',
          line: 3,
          column: 19,
          endLine: 3,
          endColumn: 25
        },
        {
          message:
            'The modulo interpolation must be enforced to named interpolation.',
          line: 6,
          column: 15,
          endLine: 6,
          endColumn: 21
        }
      ]
    }
  ]
})
