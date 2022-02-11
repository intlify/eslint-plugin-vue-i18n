/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from 'eslint'
import { join } from 'path'
import rule = require('../../../lib/rules/no-unused-keys')
import { getTestCasesFromFixtures } from '../test-utils'
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ...(semver.satisfies(require('eslint/package.json').version, '>=6')
      ? [
          ...getTestCasesFromFixtures({
            cwd: join(cwdRoot, './valid/vue-cli-format'),
            localeDir: `./locales/*.{json,yaml,yml}`,
            options: [
              {
                src: '.'
              }
            ]
          }),
          ...getTestCasesFromFixtures({
            cwd: join(cwdRoot, './valid/constructor-option-format'),
            localeDir: {
              pattern: `./locales/*.{json,yaml,yml}`,
              localeKey: 'key'
            },
            options: [
              {
                src: '.'
              }
            ]
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
            ],
            options: [
              {
                src: '.'
              }
            ]
          }),
          ...getTestCasesFromFixtures({
            cwd: join(cwdRoot, './valid/path-locales'),
            localeDir: {
              pattern: `./locales/**/*.{json,yaml,yml}`,
              localeKey: 'path',
              localePattern:
                /^.*\/(?<locale>[A-Za-z0-9-_]+)\/.*\.(json5?|ya?ml)$/
            },
            options: [
              {
                src: '.'
              }
            ]
          })
        ]
      : []),
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
      // https://github.com/intlify/eslint-plugin-vue-i18n/issues/260
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "hello {name}.": "hello {name}!"
      }
      </i18n>
      <script>
      export default {
        methods: {
          fn () {
            this.$i18n.t('hello {name}.', { name: 'DIO' })
          }
        }
      }
      </script>`
    },
    {
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "foo": "foo",
      "bar": {
        "nest": "nest",
        "ignore": "ignore",
      },
      "ignore": "ignore",
    }
    </i18n>
    <script>
    export default {
      created () {
        this.$t('foo')
        this.$t('bar.nest')
      }
    }
    </script>`,
      options: [{ ignores: ['ignore', 'bar.ignore'] }]
    },
    {
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "foo": "foo",
      "bar": {
        "nest": "nest",
        "ptn_foo": "ignore",
      },
      "ptn_bar": "ignore"
    }
    </i18n>
    <script>
    export default {
      created () {
        this.$t('foo')
        this.$t('bar.nest')
      }
    }
    </script>`,
      options: [{ ignores: ['/ptn/'] }]
    }
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
    {
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "foo": "foo",
      "bar": {
        "nest": "nest",
        "ignore": "ignore",
        "not_ignore": "not_ignore",
      },
      "ignore": "ignore",
      "not_ignore": "not_ignore",
    }
    </i18n>
    <script>
    export default {
      created () {
        this.$t('foo')
        this.$t('bar.nest')
      }
    }
    </script>`,
      options: [{ ignores: ['ignore', 'bar.ignore'] }],
      errors: [
        {
          message: "unused 'bar.not_ignore' key",
          line: 8,
          column: 9
        },
        {
          message: "unused 'not_ignore' key",
          line: 11,
          column: 7
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
    <i18n locale="en">
    {
      "foo": "foo",
      "bar": {
        "nest": "nest",
        "ptn_foo": "ignore",
        "no_hit_pattern_foo": "not_ignore"
      },
      "ptn_bar": "ignore",
      "no_hit_pattern_bar": "not_ignore"
    }
    </i18n>
    <script>
    export default {
      created () {
        this.$t('foo')
        this.$t('bar.nest')
      }
    }
    </script>`,
      options: [{ ignores: ['/ptn/'] }],
      errors: [
        {
          message: "unused 'bar.no_hit_pattern_foo' key",
          line: 8,
          column: 9
        },
        {
          message: "unused 'no_hit_pattern_bar' key",
          line: 11,
          column: 7
        }
      ]
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
        'path-locales/locales/en/message.json': true,
        'path-locales/locales/ja/message.yaml': true,
        'path-locales/src/App.vue': true,
        'path-locales/src/main.js': true,
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
    ),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ...(semver.satisfies(require('eslint/package.json').version, '>=6')
      ? [
          ...getTestCasesFromFixtures(
            {
              cwd: join(cwdRoot, './invalid/vue-cli-format'),
              localeDir: `./locales/*.{json,yaml,yml}`,
              options: [{ src: '.', enableFix: true }]
            },
            (() => {
              const fixAllEn = `{
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
              const fixAllJa = `hello: "ハローワールド"
messages:
  hello: "こんにちは、DIO！"
  nested: {}
hello_dio: "こんにちは、アンダースコア DIO！"
"hello {name}": "こんにちは、{name}！"
`
              return {
                'src/App.vue': true,
                'src/main.js': true,
                'locales/en.json': {
                  output: fixAllEn,
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
                          output: fixAllEn
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
                          output: fixAllEn
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
                          output: fixAllEn
                        }
                      ]
                    }
                  ]
                },
                'locales/ja.yaml': {
                  output: fixAllJa,
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
                          output: fixAllJa
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
                          output: fixAllJa
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
                          output: fixAllJa
                        }
                      ]
                    }
                  ]
                }
              }
            })()
          ),
          ...getTestCasesFromFixtures(
            {
              cwd: join(cwdRoot, './invalid/constructor-option-format'),
              localeDir: {
                pattern: `./locales/*.{json,yaml,yml}`,
                localeKey: 'key'
              },
              options: [{ src: '.', enableFix: true }]
            },
            (() => {
              const fixAll = `{
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
              return {
                'src/App.vue': true,
                'src/main.js': true,
                'locales/index.json': {
                  output: fixAll,
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
                          output: fixAll
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
                          output: fixAll
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
                          output: fixAll
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
                          output: fixAll
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
                          output: fixAll
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
                          output: fixAll
                        }
                      ]
                    }
                  ]
                }
              }
            })()
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
              ],
              options: [{ src: '.', enableFix: true }]
            },
            {
              'src/App.vue': true,
              'src/main.js': true,
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
          ),
          ...getTestCasesFromFixtures(
            {
              cwd: join(cwdRoot, './invalid/typescript'),
              localeDir: {
                pattern: `./locales/*.{json,yaml,yml}`,
                localeKey: 'file'
              },
              options: [
                {
                  src: './src',
                  extensions: ['.tsx', '.ts', '.vue'],
                  enableFix: true
                }
              ],
              parserOptions: {
                parser: '@typescript-eslint/parser'
              }
            },
            {
              'src/App.vue': true,
              'locales/en.json': {
                output: `{
  "hello": "hello world",
  "messages": {
    "hello": "hi DIO!",
    "nested": {
    }
  },
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!"
}
`,
                errors: [
                  "unused 'messages.link' key",
                  "unused 'messages.nested.hello' key",
                  "unused 'hello-dio' key"
                ]
              },
              'locales/ja.yaml': {
                output: `hello: "ハローワールド"
messages:
  hello: "こんにちは、DIO！"
  nested: {}
hello_dio: "こんにちは、アンダースコア DIO！"
"hello {name}": "こんにちは、{name}！"
`,
                errors: [
                  "unused 'messages.link' key",
                  "unused 'messages.nested.hello' key",
                  "unused 'hello-dio' key"
                ]
              }
            }
          )
        ]
      : [])
  ]
})
