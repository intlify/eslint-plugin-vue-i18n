/**
 * @author Yosuke Ota
 */
import { join } from 'node:path'
import { RuleTester, TEST_RULE_ID_PREFIX } from '../eslint-compat'
import { getRuleTesterTestCaseOptions } from '../test-utils'
import rule from '../../../lib/rules/prefer-linked-key-with-paren'
import * as vueParser from 'vue-eslint-parser'

const FIXTURES_ROOT = join(
  __dirname,
  '../../fixtures/prefer-linked-key-with-paren'
)

const options = getRuleTesterTestCaseOptions(FIXTURES_ROOT)

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('prefer-linked-key-with-paren', rule as never, {
  valid: [
    {
      code: `
      foo:
        bar: baz
      `,
      ...options.yaml()
    },
    {
      code: `
      foo:
        bar: "@:{'baz'}"
      `,
      ...options.yaml()
    },
    {
      code: `
      {"foo": {
        "bar": "@:{'baz'}" } }
      `,
      ...options.json()
    },
    {
      code: `
      <i18n>
      { "foo": "@:{'baz'}" }
      </i18n>
      <i18n lang="yaml">
      "foo":
        - "@:{'baz'}"
      </i18n>
      `,
      ...options.vue()
    },
    {
      //  message parse error
      code: `
      a: "@.:link"
      `,
      ...options.yaml('^9')
    }
  ],

  invalid: [
    {
      code: `
      foo: "@:baz"
      `,
      ...options.yaml(),
      output: `
      foo: "@:{'baz'}"
      `,
      errors: [
        {
          message: 'The linked message key must be enclosed in brackets.',
          line: 2,
          column: 15,
          endLine: 2,
          endColumn: 18
        }
      ]
    },
    {
      code: `
      { "foo": "@:baz" }
      `,
      ...options.json(),
      output: `
      { "foo": "@:{'baz'}" }
      `,
      errors: [
        {
          message: 'The linked message key must be enclosed in brackets.',
          line: 2,
          column: 19,
          endLine: 2,
          endColumn: 22
        }
      ]
    },
    {
      code: `
      <i18n>
      { "foo": "@:baz" }
      </i18n>
      <i18n lang="yaml">
      "foo":
        - "@:baz"
      </i18n>
      `,
      ...options.vue(),
      output: `
      <i18n>
      { "foo": "@:{'baz'}" }
      </i18n>
      <i18n lang="yaml">
      "foo":
        - "@:{'baz'}"
      </i18n>
      `,
      errors: [
        {
          message: 'The linked message key must be enclosed in brackets.',
          line: 3,
          column: 19,
          endLine: 3,
          endColumn: 22
        },
        {
          message: 'The linked message key must be enclosed in brackets.',
          line: 7,
          column: 14,
          endLine: 7,
          endColumn: 17
        }
      ]
    },

    {
      code: `
      {
        a: [
          "message @:foo",
          'message @:foo'
        ]
      }
      `,
      ...options.json(),
      output: `
      {
        a: [
          "message @:{'foo'}",
          'message @:{\\'foo\\'}'
        ]
      }
      `,
      errors: [
        'The linked message key must be enclosed in brackets.',
        'The linked message key must be enclosed in brackets.'
      ]
    },
    {
      code: `
      a: message @:foo
      b: 'message @:foo'
      c: |
        message @:foo
        message @:foo
      ? [{"message @:foo": "message @:foo"}]
      :
        ? "message @:foo"
        : "foo"
      `,
      ...options.yaml(),
      output: `
      a: message @:{'foo'}
      b: 'message @:{''foo''}'
      c: |
        message @:foo
        message @:foo
      ? [{"message @:foo": "message @:foo"}]
      :
        ? "message @:foo"
        : "foo"
      `,
      errors: [
        'The linked message key must be enclosed in brackets.',
        'The linked message key must be enclosed in brackets.',
        'The linked message key must be enclosed in brackets.',
        'The linked message key must be enclosed in brackets.'
      ]
    },

    {
      code: `
      a: "@:(link)"
      b: "@:{'link'}"
      `,
      ...options.yaml(null),
      output: null,
      errors: [
        `If you want to use '${TEST_RULE_ID_PREFIX}prefer-linked-key-with-paren' rule, you need to set 'messageSyntaxVersion' at 'settings'. See the 'eslint-plugin-vue-i18n' documentation`
      ]
    },

    {
      code: `
      {
        "foo": {
          "bar": "baz"
        }
      }
      `,
      ...options.json('^8'),
      output: null,
      errors: [
        "Please specify 9 or higher for 'messageSyntaxVersion' at 'settings'."
      ]
    }
  ]
})
