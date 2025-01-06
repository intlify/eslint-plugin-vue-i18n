/**
 * @author Yosuke Ota
 */
import { RuleTester } from '../eslint-compat'
import { join } from 'node:path'

import rule from '../../../lib/rules/no-duplicate-keys-in-locale'
import { getTestCasesFromFixtures } from '../test-utils'
import * as vueParser from 'vue-eslint-parser'

const cwdRoot = join(__dirname, '../../fixtures/no-duplicate-keys-in-locale')

new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2015,
    sourceType: 'module'
  }
}).run('no-duplicate-keys-in-locale', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "foo": "foo",
        "bar": "bar"
      }
      </i18n>
      <i18n locale="ja">
      {
        "foo": "foo",
        "bar": "bar"
      }
      </i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en": {
          "foo": "foo",
          "bar": "bar"
        },
        "ja": {
          "foo": "foo",
          "bar": "bar"
        }
      }
      </i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en" lang="yaml">
      foo: foo
      bar: bar
      </i18n>
      <i18n locale="ja" lang="yaml">
      foo: foo
      bar: bar
      </i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n lang="yaml">
      en:
        ? [{foo: {bar: baz}}]
        : 123
        foo: {bar: baz}
      </i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">{ "foo": null, "bar": 123 }</i18n>
      <template>Hello!</template>`
    },
    ...getTestCasesFromFixtures({
      cwd: join(cwdRoot, './valid/vue-cli-format'),
      localeDir: `./locales/*.{json,yaml,yml}`
    }),
    ...getTestCasesFromFixtures({
      cwd: join(cwdRoot, './valid/constructor-option-format'),
      localeDir: {
        pattern: `./locales/*.{json,yaml,yml}`,
        localeKey: 'key'
      }
    }),
    ...getTestCasesFromFixtures({
      cwd: join(cwdRoot, './valid/multiple-locales'),
      localeDir: [
        `./locales1/*.{json,yaml,yml}`,
        {
          pattern: `./locales2/*.{json,yaml,yml}`,
          localeKey: 'file'
        },
        {
          pattern: `./locales3/*.{json,yaml,yml}`,
          localeKey: 'key'
        }
      ]
    })
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "foo": "foo",
        "foo": "bar"
      }
      </i18n>
      <i18n locale="ja">
      {
        "bar": "foo",
        "bar": "bar"
      }
      </i18n>
      <template></template>
      <script>/*invalid*/</script>`,
      errors: [
        {
          message: "duplicate key 'foo'",
          line: 4
        },
        {
          message: "duplicate key 'foo'",
          line: 5
        },
        {
          message: "duplicate key 'bar'",
          line: 10
        },
        {
          message: "duplicate key 'bar'",
          line: 11
        }
      ]
    },
    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './invalid/vue-cli-format'),
        localeDir: `./locales/*.{json,yaml,yml}`
      },
      {
        'locales/en.1.json': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/en.2.json\" has the same key"
            },
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/en.2.json\" has the same key"
            }
          ]
        },
        'locales/en.2.json': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/en.1.json\" has the same key"
            },
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/en.1.json\" has the same key"
            }
          ]
        },
        'locales/ja.1.json': {
          errors: [
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/ja.2.json\" has the same key"
            }
          ]
        },
        'locales/ja.2.json': {
          errors: [
            {
              line: 8,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/ja.1.json\" has the same key"
            }
          ]
        },
        'src/App.vue': {
          errors: [
            {
              line: 2,
              message:
                "duplicate key 'block' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 4,
              message:
                "duplicate key 'nest.foo' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 10,
              message:
                'duplicate key \'dupe\' in \'ja\'. "./locales/ja.1.json", and "./locales/ja.2.json" has the same key'
            },
            {
              line: 13,
              message:
                "duplicate key 'block' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 15,
              message:
                "duplicate key 'nest.foo' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 19,
              message: "duplicate key 'json-dupe'"
            },
            {
              line: 20,
              message: "duplicate key 'nest'"
            },
            {
              line: 21,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 23,
              message: "duplicate key 'nest'"
            },
            {
              line: 24,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 26,
              message: "duplicate key 'json-dupe'"
            }
          ]
        }
      }
    ),

    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './invalid/constructor-option-format'),
        localeDir: {
          pattern: `./locales/*.{json,yaml,yml}`,
          localeKey: 'key'
        }
      },
      {
        'locales/index.1.json': {
          errors: [
            {
              line: 8,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/index.2.yaml\" has the same key"
            },
            {
              line: 10,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/index.2.yaml\" has the same key"
            },
            {
              line: 19,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/index.2.yaml\" has the same key"
            }
          ]
        },
        'locales/index.2.yaml': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/index.1.json\" has the same key"
            },
            {
              line: 8,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/index.1.json\" has the same key"
            },
            {
              line: 16,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/index.1.json\" has the same key"
            }
          ]
        },
        'src/App.vue': {
          errors: [
            {
              line: 13,
              message:
                "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 16,
              message:
                'duplicate key \'dupe\' in \'ja\'. "./locales/index.1.json", and "./locales/index.2.yaml" has the same key'
            },
            {
              line: 21,
              message: "duplicate key 'json-dupe'"
            },
            {
              line: 22,
              message:
                "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 22,
              message: "duplicate key 'nest'"
            },
            {
              line: 23,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 25,
              message:
                "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 25,
              message: "duplicate key 'nest'"
            },
            {
              line: 26,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 28,
              message: "duplicate key 'json-dupe'"
            }
          ]
        }
      }
    ),
    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './invalid/multiple-locales'),
        localeDir: [
          `./locales1/*.{json,yaml,yml}`,
          {
            pattern: `./locales2/*.{json,yaml,yml}`,
            localeKey: 'file'
          },
          {
            pattern: `./locales3/*.{json,yaml,yml}`,
            localeKey: 'key'
          }
        ]
      },
      {
        'locales1/en.1.json': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales2/en.2.json\" has the same key"
            },
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales2/en.2.json\" has the same key"
            }
          ]
        },
        'locales2/en.2.json': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales1/en.1.json\" has the same key"
            },
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales1/en.1.json\" has the same key"
            }
          ]
        },
        'locales3/index.1.json': {
          errors: [
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales3/index.2.yaml\" has the same key"
            }
          ]
        },
        'locales3/index.2.yaml': {
          errors: [
            {
              line: 8,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales3/index.1.json\" has the same key"
            }
          ]
        },
        'src/App.vue': {
          errors: [
            {
              line: 13,
              message:
                "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 16,
              message:
                'duplicate key \'dupe\' in \'ja\'. "./locales3/index.1.json", and "./locales3/index.2.yaml" has the same key'
            },
            {
              line: 21,
              message: "duplicate key 'json-dupe'"
            },
            {
              line: 22,
              message:
                "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 22,
              message: "duplicate key 'nest'"
            },
            {
              line: 23,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 25,
              message:
                "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
            },
            {
              line: 25,
              message: "duplicate key 'nest'"
            },
            {
              line: 26,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 28,
              message: "duplicate key 'json-dupe'"
            }
          ]
        }
      }
    ),
    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './invalid/vue-cli-format'),
        localeDir: `./locales/*.{json,yaml,yml}`,
        options: [{ ignoreI18nBlock: true }]
      },
      {
        'locales/en.1.json': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/en.2.json\" has the same key"
            },
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/en.2.json\" has the same key"
            }
          ]
        },
        'locales/en.2.json': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/en.1.json\" has the same key"
            },
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/en.1.json\" has the same key"
            }
          ]
        },
        'locales/ja.1.json': {
          errors: [
            {
              line: 9,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/ja.2.json\" has the same key"
            }
          ]
        },
        'locales/ja.2.json': {
          errors: [
            {
              line: 8,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/ja.1.json\" has the same key"
            }
          ]
        },
        'src/App.vue': {
          errors: [
            {
              line: 19,
              message: "duplicate key 'json-dupe'"
            },
            {
              line: 20,
              message: "duplicate key 'nest'"
            },
            {
              line: 21,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 23,
              message: "duplicate key 'nest'"
            },
            {
              line: 24,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 26,
              message: "duplicate key 'json-dupe'"
            }
          ]
        }
      }
    ),
    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './invalid/constructor-option-format'),
        localeDir: {
          pattern: `./locales/*.{json,yaml,yml}`,
          localeKey: 'key'
        },
        options: [{ ignoreI18nBlock: true }]
      },
      {
        'locales/index.1.json': {
          errors: [
            {
              line: 8,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/index.2.yaml\" has the same key"
            },
            {
              line: 10,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/index.2.yaml\" has the same key"
            },
            {
              line: 19,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/index.2.yaml\" has the same key"
            }
          ]
        },
        'locales/index.2.yaml': {
          errors: [
            {
              line: 7,
              message:
                "duplicate key 'messages.dupe' in 'en'. \"./locales/index.1.json\" has the same key"
            },
            {
              line: 8,
              message:
                "duplicate key 'dupe' in 'en'. \"./locales/index.1.json\" has the same key"
            },
            {
              line: 16,
              message:
                "duplicate key 'dupe' in 'ja'. \"./locales/index.1.json\" has the same key"
            }
          ]
        },
        'src/App.vue': {
          errors: [
            {
              line: 21,
              message: "duplicate key 'json-dupe'"
            },
            {
              line: 22,
              message: "duplicate key 'nest'"
            },
            {
              line: 23,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 25,
              message: "duplicate key 'nest'"
            },
            {
              line: 26,
              message: "duplicate key 'nest.json-dupe'"
            },
            {
              line: 28,
              message: "duplicate key 'json-dupe'"
            }
          ]
        }
      }
    )
  ]
})
