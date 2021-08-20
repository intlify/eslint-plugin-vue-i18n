/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from 'eslint'
import { join } from 'path'
import rule = require('../../../lib/rules/no-unused-keys')
import { testOnFixtures, getTestCasesFromFixtures } from '../test-utils'
import semver from 'semver'

const cwdRoot = join(__dirname, '../../fixtures/no-unused-keys')
new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
}).run('no-unused-keys', rule as never, {
  valid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "hello": "hi DIO!",
        "link": "@:messages.hello"
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
    },
    {
      // unuse i18n sfc
      filename: 'test.vue',
      code: `
    <template>
      <div id="app"></div>
    </template>
    <script>
    export default {
      created () {
      }
    }
    </script>`
    },
    {
      // <i18n> component
      filename: 'test.vue',
      code: `
    <template>
      <i18n path="message_key" tag="p" />
    </template>
    <i18n>
    {
      "en": {
        "message_key": "hi"
      }
    }
    </i18n>
    `
    },
    {
      // <i18n-t> component
      filename: 'test.vue',
      code: `
    <template>
      <i18n-t path="message_key" tag="p" />
    </template>
    <i18n>
    {
      "en": {
        "message_key": "hi"
      }
    }
    </i18n>
    `
    },
    {
      // yaml supports
      filename: 'test.vue',
      code: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`
    },
    ...getTestCasesFromFixtures({
      cwd: join(cwdRoot, './valid/vue-cli-format'),
      localeDir: `./locales/*.{json,yaml,yml}`,
      options: [
        {
          src: '.'
        }
      ]
    })
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures()
  ],
  invalid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "hello": "hi DIO!",
        "link": "@:message.hello",
        "nested": {
          "hello": "hi jojo!"
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!",
      "hello-dio": "hello hyphen DIO!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`,
      options: [{ enableFix: true }],
      output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "link": "@:message.hello",
        "nested": {
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`,
      errors: [
        {
          message: "unused 'messages.hello' key",
          line: 6,
          suggestions: [
            {
              desc: "Remove the 'messages.hello' key.",
              output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "link": "@:message.hello",
        "nested": {
          "hello": "hi jojo!"
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!",
      "hello-dio": "hello hyphen DIO!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "link": "@:message.hello",
        "nested": {
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
            }
          ]
        },
        {
          message: "unused 'messages.nested.hello' key",
          line: 9,
          suggestions: [
            {
              desc: "Remove the 'messages.nested.hello' key.",
              output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "hello": "hi DIO!",
        "link": "@:message.hello",
        "nested": {
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!",
      "hello-dio": "hello hyphen DIO!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "link": "@:message.hello",
        "nested": {
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
            }
          ]
        },
        {
          message: "unused 'hello-dio' key",
          line: 14,
          suggestions: [
            {
              desc: "Remove the 'hello-dio' key.",
              output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "hello": "hi DIO!",
        "link": "@:message.hello",
        "nested": {
          "hello": "hi jojo!"
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
      "hello": "hello world",
      "messages": {
        "link": "@:message.hello",
        "nested": {
        }
      },
      "hello_dio": "hello underscore DIO!",
      "hello {name}": "hello {name}!"
    }
    </i18n>
    <template>
      <div id="app">
        <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
      </div>
    </template>
    <script>
    export default {
      created () {
        this.$i18n.t('hello {name}', { name: 'DIO' })
        this.$t('hello')
      }
    }
    </script>`
            }
          ]
        }
      ]
    },
    {
      // html escape
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "hello": "Hello! DIO!",
      "hi": "Hi! &lt;span>DIO!&lt;/span>"
    }
    </i18n>
    <template>
      <div id="app">
        {{ $t('hello') }}
      </div>
    </template>`,
      options: [{ enableFix: true }],
      output: `
    <i18n locale="en">
    {
      "hello": "Hello! DIO!"
    }
    </i18n>
    <template>
      <div id="app">
        {{ $t('hello') }}
      </div>
    </template>`,
      errors: [
        {
          message: "unused 'hi' key",
          suggestions: [
            {
              desc: "Remove the 'hi' key.",
              output: `
    <i18n locale="en">
    {
      "hello": "Hello! DIO!"
    }
    </i18n>
    <template>
      <div id="app">
        {{ $t('hello') }}
      </div>
    </template>`
            }
          ]
        }
      ]
    },
    {
      // all remove
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "unuse1": "foo",
      "unuse2": "foo",
      "unuse3": "foo"
    }
    </i18n>
    <template></template>`,
      options: [{ enableFix: true }],
      output: `
    <i18n locale="en">
    {
      "unuse2": "foo"
    }
    </i18n>
    <template></template>`,
      errors: [
        {
          message: "unused 'unuse1' key",
          suggestions: [
            {
              desc: "Remove the 'unuse1' key.",
              output: `
    <i18n locale="en">
    {
      "unuse2": "foo",
      "unuse3": "foo"
    }
    </i18n>
    <template></template>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
    }
    </i18n>
    <template></template>`
            }
          ]
        },
        {
          message: "unused 'unuse2' key",
          suggestions: [
            {
              desc: "Remove the 'unuse2' key.",
              output: `
    <i18n locale="en">
    {
      "unuse1": "foo",
      "unuse3": "foo"
    }
    </i18n>
    <template></template>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
    }
    </i18n>
    <template></template>`
            }
          ]
        },
        {
          message: "unused 'unuse3' key",
          suggestions: [
            {
              desc: "Remove the 'unuse3' key.",
              output: `
    <i18n locale="en">
    {
      "unuse1": "foo",
      "unuse2": "foo"
    }
    </i18n>
    <template></template>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
    }
    </i18n>
    <template></template>`
            }
          ]
        }
      ]
    },
    {
      // trailing comma
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "unuse1": "foo",
      "unuse2": "foo",
    }
    </i18n>
    <template></template>`,
      options: [{ enableFix: true }],
      output: `
    <i18n locale="en">
    {
      "unuse2": "foo",
    }
    </i18n>
    <template></template>`,
      errors: [
        {
          message: "unused 'unuse1' key",
          suggestions: [
            {
              desc: "Remove the 'unuse1' key.",
              output: `
    <i18n locale="en">
    {
      "unuse2": "foo",
    }
    </i18n>
    <template></template>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
    }
    </i18n>
    <template></template>`
            }
          ]
        },
        {
          message: "unused 'unuse2' key",
          suggestions: [
            {
              desc: "Remove the 'unuse2' key.",
              output: `
    <i18n locale="en">
    {
      "unuse1": "foo"
    }
    </i18n>
    <template></template>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en">
    {
    }
    </i18n>
    <template></template>`
            }
          ]
        }
      ]
    },
    {
      // dont fix
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "unuse1": "foo"
    }
    </i18n>
    <template></template>`,
      output: null,
      errors: [
        {
          message: "unused 'unuse1' key",
          suggestions: [
            {
              desc: "Remove the 'unuse1' key.",
              output: `
    <i18n locale="en">
    {
    }
    </i18n>
    <template></template>`
            }
          ]
        }
      ]
    },
    {
      // yaml supports
      filename: 'test.vue',
      code: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
        unuse: "unuse"
      unuse-messages:
        unuse: "unuse"
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`,
      options: [{ enableFix: true }],
      output: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
      unuse-messages: {}
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`,
      errors: [
        {
          message: "unused 'messages.unuse' key",
          line: 5,
          column: 9,
          suggestions: [
            {
              desc: "Remove the 'messages.unuse' key.",
              output: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
      unuse-messages:
        unuse: "unuse"
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
      unuse-messages: {}
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`
            }
          ]
        },
        {
          message: "unused 'unuse-messages.unuse' key",
          line: 7,
          column: 9,
          suggestions: [
            {
              desc: "Remove the 'unuse-messages.unuse' key.",
              output: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
        unuse: "unuse"
      unuse-messages: {}
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en" lang="yaml">
      messages:
        hello: "hi DIO!"
      unuse-messages: {}
    </i18n>
    <template>
      <div id="app">
        {{ $t('messages.hello') }}
      </div>
    </template>
    <script>
    </script>`
            }
          ]
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
    <i18n locale="en" lang="yaml">
      hello: "hi DIO!"
      flow-block: {
        "unuse1": "unuse",
        "unuse2": "unuse"
      }
      flow-seq: [
        "unuse",
        "unuse",
      ]
      seq-unuse:
        - "unuse"
      ? {foo:bar}
      : value
    </i18n>
    <i18n locale="zh" lang="yaml">
      hi: "你好"
    </i18n>
    <i18n locale="ko" lang="yaml">
      - "하이"
    </i18n>
    <i18n locale="ja" lang="json5">
    {
      hello: "hi DIO!",
      unuse: "unuse",
      "array-unuse": [
        "unuse"
      ]
    }
    </i18n>
    <template><div id="app"> {{ $t('messages.hello') }}</div></template><script></script>`,
      options: [{ enableFix: true }],
      output: `
    <i18n locale="en" lang="yaml">
${' '.repeat(6)}
      flow-block: {
        "unuse2": "unuse"
      }
      flow-seq: [
        "unuse",
      ]
      seq-unuse: []
      ? {foo:bar}
      : value
    </i18n>
    <i18n locale="zh" lang="yaml">
      {}
    </i18n>
    <i18n locale="ko" lang="yaml">
      []
    </i18n>
    <i18n locale="ja" lang="json5">
    {
      unuse: "unuse",
      "array-unuse": [
      ]
    }
    </i18n>
    <template><div id="app"> {{ $t('messages.hello') }}</div></template><script></script>`,
      errors: [
        {
          message: "unused 'hello' key",
          suggestions: [
            {
              desc: "Remove the 'hello' key.",
              output: `
    <i18n locale="en" lang="yaml">
${' '.repeat(6)}
      flow-block: {
        "unuse1": "unuse",
        "unuse2": "unuse"
      }
      flow-seq: [
        "unuse",
        "unuse",
      ]
      seq-unuse:
        - "unuse"
      ? {foo:bar}
      : value
    </i18n>
    <i18n locale="zh" lang="yaml">
      hi: "你好"
    </i18n>
    <i18n locale="ko" lang="yaml">
      - "하이"
    </i18n>
    <i18n locale="ja" lang="json5">
    {
      hello: "hi DIO!",
      unuse: "unuse",
      "array-unuse": [
        "unuse"
      ]
    }
    </i18n>
    <template><div id="app"> {{ $t('messages.hello') }}</div></template><script></script>`
            },
            {
              desc: 'Remove all unused keys.',
              output: `
    <i18n locale="en" lang="yaml">
${' '.repeat(6)}
      flow-block: {}
      flow-seq: []
      seq-unuse: []
    </i18n>
    <i18n locale="zh" lang="yaml">
      hi: "你好"
    </i18n>
    <i18n locale="ko" lang="yaml">
      - "하이"
    </i18n>
    <i18n locale="ja" lang="json5">
    {
      hello: "hi DIO!",
      unuse: "unuse",
      "array-unuse": [
        "unuse"
      ]
    }
    </i18n>
    <template><div id="app"> {{ $t('messages.hello') }}</div></template><script></script>`
            }
          ]
        },
        "unused 'flow-block.unuse1' key",
        "unused 'flow-block.unuse2' key",
        "unused 'flow-seq[0]' key",
        "unused 'flow-seq[1]' key",
        "unused 'seq-unuse[0]' key",
        "unused '{foo:bar}' key",
        "unused 'hi' key",
        "unused '[0]' key",
        "unused 'hello' key",
        "unused 'unuse' key",
        "unused 'array-unuse[0]' key"
      ]
    },
    {
      // without <template>
      filename: 'test.vue',
      code: `
      <i18n lang="yaml" locale="en">
      test: Test
      </i18n>
      <script>
      // without <template>
      export default {
        render (createElement) {}
      }
      </script>`,
      options: [{ enableFix: true }],
      output: `
      <i18n lang="yaml" locale="en">
      {}
      </i18n>
      <script>
      // without <template>
      export default {
        render (createElement) {}
      }
      </script>`,
      errors: [
        {
          message: "unused 'test' key",
          suggestions: [
            {
              desc: "Remove the 'test' key.",
              output: `
      <i18n lang="yaml" locale="en">
      {}
      </i18n>
      <script>
      // without <template>
      export default {
        render (createElement) {}
      }
      </script>`
            }
          ]
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
    <i18n locale="en" lang="yaml">
    ? [{foo: bar}]
    : {foo: bar}
    </i18n>
    <template></template>
    <script></script>`,
      errors: [`unused '["[{foo: bar}]"].foo' key`]
    },
    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './valid')
      },
      {
        'constructor-option-format/src/App.vue': true,
        'constructor-option-format/src/main.js': true,
        'multiple-locales/src/App.vue': true,
        'multiple-locales/src/main.js': true,
        'vue-cli-format/src/App.vue': true,
        'vue-cli-format/src/main.js': true,
        'constructor-option-format/locales/index.json': {
          output: null,
          errors: [
            {
              line: 1,
              message:
                "You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation"
            }
          ]
        },
        'vue-cli-format/locales/en.json': {
          output: null,
          errors: [
            {
              line: 1,
              message:
                "You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation"
            }
          ]
        },
        'vue-cli-format/locales/ja.yaml': {
          output: null,
          errors: [
            {
              line: 1,
              message:
                "You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation"
            }
          ]
        },
        'multiple-locales/locales1/en.1.json': {
          output: null,
          errors: [
            {
              line: 1,
              message:
                "You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation"
            }
          ]
        },
        'multiple-locales/locales2/en.2.json': {
          output: null,
          errors: [
            {
              line: 1,
              message:
                "You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation"
            }
          ]
        },
        'multiple-locales/locales3/index.json': {
          output: null,
          errors: [
            {
              line: 1,
              message:
                "You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation"
            }
          ]
        }
      }
    )
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures(),
    // ...getTestCasesFromFixtures()
  ]
})

describe('no-unused-keys with fixtures', () => {
  describe('errors', () => {
    it('settings.vue-i18n.localeDir', async () => {
      // await testOnFixtures()
    })
  })

  describe('valid', () => {
    it('should be not detected unsued keys', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      await testOnFixtures(
        {
          cwd: join(cwdRoot, './valid/vue-cli-format'),
          localeDir: `./locales/*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          options: [
            {
              src: '.'
            }
          ]
        },
        {}
      )
    })

    it('should be not detected unsued keys for constructor-option-format', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      await testOnFixtures(
        {
          cwd: join(cwdRoot, './valid/constructor-option-format'),
          localeDir: {
            pattern: `./locales/*.{json,yaml,yml}`,
            localeKey: 'key'
          },
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          options: [
            {
              src: '.'
            }
          ]
        },
        {}
      )
    })

    it('should be not detected unsued keys for multiple-locales', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      await testOnFixtures(
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
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          options: [
            {
              src: '.'
            }
          ]
        },
        {}
      )
    })
  })

  describe('invalid', () => {
    it('should be detected unsued keys', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      const fixallEn = `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
    }
  },
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!"
}
`
      const fixallJa = `hello: "ハローワールド"
messages:
  hello: "こんにちは、DIO！"
  nested: {}
hello_dio: "こんにちは、アンダースコア DIO！"
"hello {name}": "こんにちは、{name}！"
`
      await testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/vue-cli-format'),
          localeDir: `./locales/*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          options: [{ src: '.', enableFix: true }]
        },
        {
          'locales/en.json': {
            output: fixallEn,
            errors: [
              {
                message: "unused 'messages.link' key",
                line: 5,
                suggestions: [
                  {
                    desc: "Remove the 'messages.link' key.",
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
      "hello": "hi jojo!"
    }
  },
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!",
  "hello-dio": "hello hyphen DIO!"
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixallEn
                  }
                ]
              },
              {
                message: "unused 'messages.nested.hello' key",
                line: 7,
                suggestions: [
                  {
                    desc: "Remove the 'messages.nested.hello' key.",
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "link": "@:message.hello",
    "nested": {
    }
  },
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!",
  "hello-dio": "hello hyphen DIO!"
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixallEn
                  }
                ]
              },
              {
                message: "unused 'hello-dio' key",
                line: 12,
                suggestions: [
                  {
                    desc: "Remove the 'hello-dio' key.",
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "link": "@:message.hello",
    "nested": {
      "hello": "hi jojo!"
    }
  },
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!"
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixallEn
                  }
                ]
              }
            ]
          },
          'locales/ja.yaml': {
            output: fixallJa,
            errors: [
              {
                message: "unused 'messages.link' key",
                line: 4,
                suggestions: [
                  {
                    desc: "Remove the 'messages.link' key.",
                    output: `hello: "ハローワールド"
messages:
  hello: "こんにちは、DIO！"
  nested:
    hello: "こんにちは、ジョジョ!"
hello_dio: "こんにちは、アンダースコア DIO！"
"hello {name}": "こんにちは、{name}！"
hello-dio: "こんにちは、ハイフン DIO！"
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixallJa
                  }
                ]
              },
              {
                message: "unused 'messages.nested.hello' key",
                line: 6,
                suggestions: [
                  {
                    desc: "Remove the 'messages.nested.hello' key.",
                    output: `hello: "ハローワールド"
messages:
  hello: "こんにちは、DIO！"
  link: "@:message.hello"
  nested: {}
hello_dio: "こんにちは、アンダースコア DIO！"
"hello {name}": "こんにちは、{name}！"
hello-dio: "こんにちは、ハイフン DIO！"
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixallJa
                  }
                ]
              },
              {
                message: "unused 'hello-dio' key",
                line: 9,
                suggestions: [
                  {
                    desc: "Remove the 'hello-dio' key.",
                    output: `hello: "ハローワールド"
messages:
  hello: "こんにちは、DIO！"
  link: "@:message.hello"
  nested:
    hello: "こんにちは、ジョジョ!"
hello_dio: "こんにちは、アンダースコア DIO！"
"hello {name}": "こんにちは、{name}！"
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixallJa
                  }
                ]
              }
            ]
          }
        }
      )
    })

    it('should be detected unsued keys for constructor-option-format', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      const fixall = `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "nested": {
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
      await testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/constructor-option-format'),
          localeDir: {
            pattern: `./locales/*.{json,yaml,yml}`,
            localeKey: 'key'
          },
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          options: [{ src: '.', enableFix: true }]
        },
        {
          'locales/index.json': {
            output: fixall,
            errors: [
              {
                message: "unused 'en.messages.link' key",
                line: 6,
                suggestions: [
                  {
                    desc: "Remove the 'en.messages.link' key.",
                    output: `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "nested": {
        "hello": "hi jojo!"
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!",
    "hello-dio": "hello hyphen DIO!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixall
                  }
                ]
              },
              {
                message: "unused 'en.messages.nested.hello' key",
                line: 8,
                suggestions: [
                  {
                    desc: "Remove the 'en.messages.nested.hello' key.",
                    output: `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "link": "@:message.hello",
      "nested": {
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!",
    "hello-dio": "hello hyphen DIO!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixall
                  }
                ]
              },
              {
                message: "unused 'en.hello-dio' key",
                line: 13,
                suggestions: [
                  {
                    desc: "Remove the 'en.hello-dio' key.",
                    output: `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "link": "@:message.hello",
      "nested": {
        "hello": "hi jojo!"
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixall
                  }
                ]
              },
              {
                message: "unused 'ja.messages.link' key",
                line: 19,
                suggestions: [
                  {
                    desc: "Remove the 'ja.messages.link' key.",
                    output: `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "link": "@:message.hello",
      "nested": {
        "hello": "hi jojo!"
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!",
    "hello-dio": "hello hyphen DIO!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixall
                  }
                ]
              },
              {
                message: "unused 'ja.messages.nested.hello' key",
                line: 21,
                suggestions: [
                  {
                    desc: "Remove the 'ja.messages.nested.hello' key.",
                    output: `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "link": "@:message.hello",
      "nested": {
        "hello": "hi jojo!"
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!",
    "hello-dio": "hello hyphen DIO!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixall
                  }
                ]
              },
              {
                message: "unused 'ja.hello-dio' key",
                line: 26,
                suggestions: [
                  {
                    desc: "Remove the 'ja.hello-dio' key.",
                    output: `{
  "en": {
    "hello": "hello world",
    "messages": {
      "hello": "hi DIO!",
      "link": "@:message.hello",
      "nested": {
        "hello": "hi jojo!"
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!",
    "hello-dio": "hello hyphen DIO!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: fixall
                  }
                ]
              }
            ]
          }
        }
      )
    })

    it('should be detected unsued keys for multiple-locales', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      await testOnFixtures(
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
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          options: [{ src: '.', enableFix: true }]
        },
        {
          'locales1/en.json': {
            output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
    }
  }
}
`,
            errors: [
              {
                line: 5,
                message: "unused 'messages.link' key",
                suggestions: [
                  {
                    desc: "Remove the 'messages.link' key.",
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
      "hello": "hi jojo!"
    }
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
    }
  }
}
`
                  }
                ]
              },
              {
                line: 7,
                message: "unused 'messages.nested.hello' key",
                suggestions: [
                  {
                    desc: "Remove the 'messages.nested.hello' key.",
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "link": "@:message.hello",
    "nested": {
    }
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
    }
  }
}
`
                  }
                ]
              }
            ]
          },
          'locales2/en.json': {
            output: `{
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!"
}
`,
            errors: [
              {
                line: 4,
                message: "unused 'hello-dio' key",
                suggestions: [
                  {
                    desc: "Remove the 'hello-dio' key.",
                    output: `{
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!"
}
`
                  }
                ]
              }
            ]
          },
          'locales3/index.json': {
            output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`,
            errors: [
              {
                line: 6,
                message: "unused 'ja.messages.link' key",
                suggestions: [
                  {
                    desc: "Remove the 'ja.messages.link' key.",
                    output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
                  }
                ]
              },
              {
                line: 8,
                message: "unused 'ja.messages.nested.hello' key",
                suggestions: [
                  {
                    desc: "Remove the 'ja.messages.nested.hello' key.",
                    output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！",
    "hello-dio": "こんにちは、ハイフン DIO！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
                  }
                ]
              },
              {
                line: 13,
                message: "unused 'ja.hello-dio' key",
                suggestions: [
                  {
                    desc: "Remove the 'ja.hello-dio' key.",
                    output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "link": "@:message.hello",
      "nested": {
        "hello": "こんにちは、ジョジョ!"
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
                  },
                  {
                    desc: 'Remove all unused keys.',
                    output: `{
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "hello": "こんにちは、DIO！",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
                  }
                ]
              }
            ]
          }
        }
      )
    })

    it('should be detected unsued keys with typescript', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
      if (!semver.satisfies(require('eslint/package.json').version, '>=6')) {
        return
      }
      await testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid/typescript'),
          ruleName: '@intlify/vue-i18n/no-unused-keys',
          useEslintrc: true
        },
        {
          'locales/en.json': {
            errors: [
              "unused 'messages.link' key",
              "unused 'messages.nested.hello' key",
              "unused 'hello-dio' key"
            ]
          },
          'locales/ja.yaml': {
            errors: [
              "unused 'messages.link' key",
              "unused 'messages.nested.hello' key",
              "unused 'hello-dio' key"
            ]
          }
        },
        { messageOnly: true }
      )
    })
  })
})
