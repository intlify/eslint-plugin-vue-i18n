/**
 * @author Yosuke Ota
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RuleTester } from 'eslint'
import rule from '../../../lib/rules/prefer-linked-key-with-paren'

const require = createRequire(import.meta.url)
const vueParser = require.resolve('vue-eslint-parser')
const jsonParser = require.resolve('jsonc-eslint-parser')
const yamlParser = require.resolve('yaml-eslint-parser')
const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES_ROOT = join(
  __dirname,
  '../../fixtures/prefer-linked-key-with-paren'
)

const options = {
  json(messageSyntaxVersion: string | null = '^9.0.0') {
    return {
      parser: jsonParser,
      filename: join(FIXTURES_ROOT, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: {
            pattern: FIXTURES_ROOT + '/*.{json,yaml,yml}'
          },
          messageSyntaxVersion
        }
      }
    }
  },
  yaml(messageSyntaxVersion: string | null = '^9.0.0') {
    return {
      parser: yamlParser,
      filename: join(FIXTURES_ROOT, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: {
            pattern: FIXTURES_ROOT + '/*.{json,yaml,yml}'
          },
          messageSyntaxVersion
        }
      }
    }
  },
  vue(messageSyntaxVersion: string | null = '^9.0.0') {
    return {
      parser: vueParser,
      filename: join(FIXTURES_ROOT, 'test.vue'),
      settings: {
        'vue-i18n': {
          messageSyntaxVersion
        }
      }
    }
  }
}

const tester = new RuleTester({
  parser: vueParser,
  parserOptions: { ecmaVersion: 2015 }
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
      {
        "foo": {
          "bar": "baz"
        }
      }
      `,
      ...options.json('^8')
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
      foo:
        bar: "@:(baz)"
      `,
      ...options.yaml('^8')
    },
    {
      code: `
      {"foo": {
        "bar": "@:(baz)" } }
      `,
      ...options.json('^8')
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
      //  This rule cannot support two versions in the same project.
      code: `
      a: "@:link"
      `,
      ...options.yaml('^8 || ^9')
    },

    {
      //  message parse error
      code: `
      a: "@.:link"
      `,
      ...options.yaml('^9')
    },
    {
      //  message parse error
      code: `
      a: "@.:link"
      `,
      ...options.yaml('^8')
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
      foo: "@:baz"
      `,
      ...options.yaml('^8'),
      output: `
      foo: "@:(baz)"
      `,
      errors: [
        {
          message: 'The linked message key must be enclosed in parentheses.',
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
      ...options.json('^8'),
      output: `
      { "foo": "@:(baz)" }
      `,
      errors: [
        {
          message: 'The linked message key must be enclosed in parentheses.',
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
      <i18n>
      { "foo": "@:baz" }
      </i18n>
      <i18n lang="yaml">
      "foo":
        - "@:baz"
      </i18n>
      `,
      ...options.vue('^8'),
      output: `
      <i18n>
      { "foo": "@:(baz)" }
      </i18n>
      <i18n lang="yaml">
      "foo":
        - "@:(baz)"
      </i18n>
      `,
      errors: [
        {
          message: 'The linked message key must be enclosed in parentheses.',
          line: 3,
          column: 19,
          endLine: 3,
          endColumn: 22
        },
        {
          message: 'The linked message key must be enclosed in parentheses.',
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
      ...options.yaml('^8'),
      output: `
      a: message @:(foo)
      b: 'message @:(foo)'
      c: |
        message @:foo
        message @:foo
      ? [{"message @:foo": "message @:foo"}]
      :
        ? "message @:foo"
        : "foo"
      `,
      errors: [
        'The linked message key must be enclosed in parentheses.',
        'The linked message key must be enclosed in parentheses.',
        'The linked message key must be enclosed in parentheses.',
        'The linked message key must be enclosed in parentheses.'
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
        "If you want to use 'prefer-linked-key-with-paren' rule, you need to set 'messageSyntaxVersion' at 'settings'. See the 'eslint-plugin-vue-i18n' documentation"
      ]
    }
  ]
})
