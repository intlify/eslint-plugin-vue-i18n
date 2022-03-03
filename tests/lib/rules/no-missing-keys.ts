/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import path from 'path'
import { RuleTester } from 'eslint'
import rule = require('../../../lib/rules/no-missing-keys')

const localeDirs = [
  './tests/fixtures/no-missing-keys/vue-cli-format/locales/*.{json,yaml,yml}',
  {
    pattern:
      './tests/fixtures/no-missing-keys/constructor-option-format/locales/*.{json,yaml,yml}',
    localeKey: 'key'
  },
  [
    './tests/fixtures/no-missing-keys/multiple-locales/locales1/*.{json,yaml,yml}',
    {
      pattern:
        './tests/fixtures/no-missing-keys/multiple-locales/locales2/*.{json,yaml,yml}',
      localeKey: 'key'
    },
    {
      pattern:
        './tests/fixtures/no-missing-keys/multiple-locales/locales3/*.{json,yaml,yml}',
      localeKey: 'file'
    }
  ]
]

function buildTestsForLocales<
  T extends RuleTester.ValidTestCase | RuleTester.InvalidTestCase
>(testcases: T[], otherTestcases: T[]): T[] {
  const result: T[] = []
  for (const testcase of testcases) {
    for (const localeDir of localeDirs) {
      result.push({
        ...testcase,
        settings: {
          'vue-i18n': { localeDir }
        }
      })
    }
  }
  return [...result, ...otherTestcases]
}

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
})

tester.run('no-missing-keys', rule as never, {
  valid: buildTestsForLocales(
    [
      {
        // basic key
        code: `$t('hello')`
      },
      {
        // nested key
        code: `t('messages.nested.hello')`
      },
      {
        // linked key
        code: `$tc('messages.link')`
      },
      {
        // hypened key
        code: `tc('hello-dio')`
      },
      {
        // key like the message
        code: `$t('hello {name}')`
      },
      {
        // instance member
        code: `i18n.t('hello {name}')`
      },
      {
        // identifier
        code: `$t(key)`
      },
      {
        // using mustaches in template block
        code: `<template>
      <p>{{ $t('hello') }}</p>
    </template>`
      },
      {
        // using custom directive in template block
        code: `<template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        code: `$t('messages.en-only')`
      }
    ],
    [
      {
        // sfc supports
        code: `<i18n>{"en": {"hello": "hello"}}</i18n>
    <template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        // sfc with locale
        code: `<i18n locale="en">{"hello": "hello"}</i18n>
    <i18n locale="ja">{"hello": "こんにちは"}</i18n>
    <template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        // sfc with locale
        code: `<i18n locale="en">{"hello": "hello"}</i18n>
    <i18n locale="ja">{"he": "こんにちは"}</i18n>
    <template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        // sfc with src
        filename: path.join(
          __dirname,
          '../../fixtures/no-missing-keys/sfc/src/Test.vue'
        ),
        code: `<i18n src="../locales/json01.json" />
    <template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        // sfc with src and locale
        filename: path.join(
          __dirname,
          '../../fixtures/no-missing-keys/sfc/src/Test.vue'
        ),
        code: `<i18n src="../locales/json02-en.json" locale="en" />
    <i18n src="../locales/json02-ja.json" locale="ja" />
    <template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        // yaml
        filename: path.join(
          __dirname,
          '../../fixtures/no-missing-keys/sfc/src/Test.vue'
        ),
        code: `<i18n src="../locales/yaml01.yml" />
    <template>
      <p v-t="'hello'"></p>
    </template>`
      },
      {
        // unuse i18n sfc
        filename: 'test.vue',
        code: `
    <template>
      <div id="app"></div>
    </template>`
      },
      {
        filename: 'test.vue',
        code: `
        <i18n locale="en">{"hello": "hello"}</i18n>
        <template>
          <i18n-t keypath="'hello'"></i18n-t>
        </template>`
      },
      {
        filename: 'test.vue',
        code: `
        <i18n locale="en">
        {
          "Usage: $0 <command> [options]": "Usage: $0 <command> [options]"
        }
        </i18n>
        <script>
        t('Usage: $0 <command> [options]')
        </script>`
      },
      {
        filename: 'test.vue',
        code: `
        <i18n locale="en">
        {
          "foo.bar": "Message"
        }
        </i18n>
        <script>
        t('foo.bar')
        </script>`
      },
      {
        // template literal
        filename: 'test.vue',
        code: `
        <i18n locale="en">
        { "foo": "foo", "bar": "bar", "baz": "baz" }
        </i18n>
        <template>
          <div id="app">
            {{ $t(\`foo\`) }}
          </div>
          <div v-t="\`baz\`"/>
        </template>
        <script>
        export default {
          created () {
            this.$t(\`bar\`)
          }
        }
        </script>`
      }
    ]
  ),

  invalid: buildTestsForLocales(
    [
      {
        // basic
        code: `$t('missing')`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // using mustaches in template block
        code: `<template>
      <p>{{ $t('missing') }}</p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // using custom directive in template block
        code: `<template>
      <p v-t="'missing'"></p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // using <i18n> functional component in template block
        code: `<template>
      <div id="app">
        <i18n path="missing"/>
      </div>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // using <i18n-t> functional component in template block
        code: `<template>
      <div id="app">
        <i18n-t path="missing"/>
      </div>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // nested basic
        code: `$t('missing.path')`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // nested missing
        code: `$t('messages.missing')`,
        errors: [
          `'messages.missing' does not exist in localization message resources`
        ]
      },
      {
        // nested missing
        code: `$t('messages.missing')`,
        errors: [
          `'messages.missing' does not exist in localization message resources`
        ]
      }
    ],
    [
      {
        // settings.vue-i18n.localeDir' error
        code: `$t('missing')`,
        errors: [
          `You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation`
        ]
      },
      {
        // sfc supports
        code: `<i18n>{"en": {"hello": "hello"}}</i18n>
    <template>
      <p v-t="'missing'"></p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // sfc with locale
        code: `<i18n locale="en">{"hello": "hello"}</i18n>
    <i18n locale="ja">{"hello": "こんにちは"}</i18n>
    <template>
      <p v-t="'missing'"></p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // sfc with src
        filename: path.join(
          __dirname,
          '../../fixtures/no-missing-keys/sfc/src/Test.vue'
        ),
        code: `<i18n src="../locales/json01.json" />
    <template>
      <p v-t="'missing'"></p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // sfc with src and locale
        filename: path.join(
          __dirname,
          '../../fixtures/no-missing-keys/sfc/src/Test.vue'
        ),
        code: `<i18n src="../locales/json02-en.json" locale="en" />
    <i18n src="../locales/json02-ja.json" locale="ja" />
    <template>
      <p v-t="'missing'"></p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        // yaml
        filename: path.join(
          __dirname,
          '../../fixtures/no-missing-keys/sfc/src/Test.vue'
        ),
        code: `<i18n src="../locales/yaml01.yml" />
    <template>
      <p v-t="'missing'"></p>
    </template>`,
        errors: [`'missing' does not exist in localization message resources`]
      },
      {
        filename: 'test.vue',
        code: `
        <i18n locale="en">{"hello": "hello"}</i18n>
        <template>
          <i18n-t keypath="hi"></i18n-t>
        </template>`,
        errors: [`'hi' does not exist in localization message resources`]
      },
      {
        // template literal
        filename: 'test.vue',
        code: `
        <i18n locale="en">
        {  }
        </i18n>
        <template>
          <div id="app">
            {{ $t(\`foo\`) }}
          </div>
          <div v-t="\`baz\`"/>
        </template>
        <script>
        export default {
          created () {
            this.$t(\`bar\`)
          }
        }
        </script>`,
        errors: [
          {
            message: "'foo' does not exist in localization message resources",
            line: 7
          },
          {
            message: "'baz' does not exist in localization message resources",
            line: 9
          },
          {
            message: "'bar' does not exist in localization message resources",
            line: 14
          }
        ]
      }
    ]
  )
})
