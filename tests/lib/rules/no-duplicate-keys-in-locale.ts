/**
 * @author Yosuke Ota
 */
import { RuleTester } from 'eslint'
import { join } from 'path'

import rule = require('../../../lib/rules/no-duplicate-keys-in-locale')
import { testOnFixtures } from '../test-utils'

new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
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
    }
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
    }
  ]
})

describe('no-duplicate-keys-in-locale with fixtures', () => {
  const cwdRoot = join(__dirname, '../../fixtures/no-duplicate-keys-in-locale')

  describe('valid', () => {
    it('should be not detected dupe keys', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './valid/vue-cli-format'),
          localeDir: `./locales/*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
        },
        {}
      )
    })

    it('should be not detected dupe keys for constructor-option-format', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './valid/constructor-option-format'),
          localeDir: {
            pattern: `./locales/*.{json,yaml,yml}`,
            localeKey: 'key'
          },
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
        },
        {}
      )
    })
    it('should be not detected dupe keys for multiple-locales', () => {
      testOnFixtures(
        {
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
          ],
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
        },
        {}
      )
    })
  })

  describe('invalid', () => {
    it('should be detected dupe keys', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/vue-cli-format'),
          localeDir: `./locales/*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
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
                  "duplicate key 'dupe' in 'ja'. \"./locales/ja.1.json\" has the same key"
              },
              {
                line: 10,
                message:
                  "duplicate key 'dupe' in 'ja'. \"./locales/ja.2.json\" has the same key"
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
      )
    })

    it('should be detected dupe keys for constructor-option-format', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/constructor-option-format'),
          localeDir: {
            pattern: `./locales/*.{json,yaml,yml}`,
            localeKey: 'key'
          },
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
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
                  "duplicate key 'dupe' in 'ja'. \"./locales/index.1.json\" has the same key"
              },
              {
                line: 16,
                message:
                  "duplicate key 'dupe' in 'ja'. \"./locales/index.2.yaml\" has the same key"
              },
              {
                line: 21,
                message: "duplicate key 'json-dupe'"
              },
              {
                line: 22,
                message: "duplicate key 'nest'"
              },
              {
                line: 22,
                message:
                  "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
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
                line: 25,
                message:
                  "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
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
    })
    it('should be detected dupe keys for multiple-locales', () => {
      testOnFixtures(
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
          ],
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
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
                  "duplicate key 'dupe' in 'ja'. \"./locales3/index.1.json\" has the same key"
              },
              {
                line: 16,
                message:
                  "duplicate key 'dupe' in 'ja'. \"./locales3/index.2.yaml\" has the same key"
              },
              {
                line: 21,
                message: "duplicate key 'json-dupe'"
              },
              {
                line: 22,
                message: "duplicate key 'nest'"
              },
              {
                line: 22,
                message:
                  "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
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
                line: 25,
                message:
                  "duplicate key 'nest' in 'en'. \"./src/App.vue\" has the same key"
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
    })

    it('should be detected dupe keys with ignoreI18nBlock', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/vue-cli-format'),
          localeDir: `./locales/*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale',
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
      )
    })

    it('should be detected dupe keys with ignoreI18nBlock for constructor-option-format', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/constructor-option-format'),
          localeDir: {
            pattern: `./locales/*.{json,yaml,yml}`,
            localeKey: 'key'
          },
          ruleName: '@intlify/vue-i18n/no-duplicate-keys-in-locale',
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
    })
  })
})
