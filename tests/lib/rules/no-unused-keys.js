/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Module = require('module')
const { CLIEngine, RuleTester } = require('eslint')
const { SourceCodeFixer } = require('eslint/lib/linter')
const { resolve, join } = require('path')
const assert = require('assert')

const rule = require('../../../lib/rules/no-unused-keys')

new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
}).run('no-unused-keys', rule, {
  valid: [{
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
  }, {
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
  }],
  invalid: [{
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
    errors: [{
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
    }]
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
    errors: [{
      message: "unused 'hi' key",
      suggestions: [{
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
      }]
    }]
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
    errors: [{
      message: "unused 'unuse1' key",
      suggestions: [{
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
      }]
    },
    {
      message: "unused 'unuse2' key",
      suggestions: [{
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
      }]
    },
    {
      message: "unused 'unuse3' key",
      suggestions: [{
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
      }]
    }]
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
    errors: [{
      message: "unused 'unuse1' key",
      suggestions: [{
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
      }]
    },
    {
      message: "unused 'unuse2' key",
      suggestions: [{
        desc: "Remove the 'unuse2' key.",
        output: `
    <i18n locale="en">
    {
      "unuse1": "foo",
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
      }]
    }]
  }]
})

describe('no-unused-keys with fixtures', () => {
  let originalCwd
  const resolveFilename = Module._resolveFilename

  before(() => {
    Module._resolveFilename = function (id) {
      if (id === '@intlify/eslint-plugin-vue-i18n') {
        return resolve(__dirname, '../../../lib/index.js')
      }
      return resolveFilename.apply(this, arguments)
    }
    originalCwd = process.cwd()
    const p = join(__dirname, '../../fixtures/no-unused-keys')
    process.chdir(p)
  })

  after(() => {
    Module._resolveFilename = resolveFilename
    process.chdir(originalCwd)
  })

  describe('errors', () => {
    it('settings.vue-i18n.localeDir', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base']
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module'
        },
        rules: {
          '@intlify/vue-i18n/no-unused-keys': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)
      messages.results.map(result => {
        return result.messages
          .filter(message => message.ruleId === '@intlify/vue-i18n/no-unused-keys')
      }).reduce((values, current) => values.concat(current), [])
        .forEach(message => {
          assert.equal(message.message, `You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation`)
        })
    })
  })

  describe('valid', () => {
    it('should be not detected unsued keys', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base'],
          settings: {
            'vue-i18n': {
              localeDir: `./valid/vue-cli-format/locales/*.json`
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module'
        },
        rules: {
          '@intlify/vue-i18n/no-unused-keys': ['error', {
            src: resolve(__dirname, '../../fixtures/no-unused-keys/valid/vue-cli-format')
          }]
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 0)
    })

    it('should be not detected unsued keys for constructor-option-format', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base'],
          settings: {
            'vue-i18n': {
              localeDir: { pattern: `./valid/constructor-option-format/locales/*.json`, localeKey: 'key' }
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module'
        },
        rules: {
          '@intlify/vue-i18n/no-unused-keys': ['error', {
            src: resolve(__dirname, '../../fixtures/no-unused-keys/valid/constructor-option-format')
          }]
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 0)
    })
  })

  describe('invalid', () => {
    it('should be detected unsued keys', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base'],
          settings: {
            'vue-i18n': {
              localeDir: `./invalid/vue-cli-format/locales/*.json`
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module'
        },
        rules: {
          '@intlify/vue-i18n/no-unused-keys': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)

      function getRuleErrors (path) {
        const fullPath = resolve(__dirname, path)
        const result = messages.results
          .find(result => result.filePath === fullPath)
        return result.messages.map(message => {
          assert.equal(message.ruleId, '@intlify/vue-i18n/no-unused-keys')
          return {
            message: message.message,
            line: message.line,
            suggestions: message.suggestions
              .map(suggest => {
                const output = SourceCodeFixer.applyFixes(result.source, [suggest]).output
                return {
                  desc: suggest.desc,
                  output
                }
              })
          }
        })
      }
      const fixallEn = `{
  "hello": "hello world",
  "messages": {
    "link": "@:message.hello",
    "nested": {
    }
  },
  "hello_dio": "hello underscore DIO!",
  "hello {name}": "hello {name}!"
}
`
      assert.deepStrictEqual(
        getRuleErrors('../../fixtures/no-unused-keys/invalid/vue-cli-format/locales/en.json'),
        [
          {
            message: "unused 'messages.hello' key",
            line: 4,
            suggestions: [
              {
                desc: "Remove the 'messages.hello' key.",
                output: `{
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
      )
      const fixallJa = `{
  "hello": "ハローワールド",
  "messages": {
    "link": "@:message.hello",
    "nested": {
    }
  },
  "hello_dio": "こんにちは、アンダースコア DIO！",
  "hello {name}": "こんにちは、{name}！"
}
`
      assert.deepStrictEqual(
        getRuleErrors('../../fixtures/no-unused-keys/invalid/vue-cli-format/locales/ja.json'),
        [
          {
            message: "unused 'messages.hello' key",
            line: 4,
            suggestions: [
              {
                desc: "Remove the 'messages.hello' key.",
                output: `{
  "hello": "ハローワールド",
  "messages": {
    "link": "@:message.hello",
    "nested": {
      "hello": "こんにちは、ジョジョ!"
    }
  },
  "hello_dio": "こんにちは、アンダースコア DIO！",
  "hello {name}": "こんにちは、{name}！",
  "hello-dio": "こんにちは、ハイフン DIO！"
}
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
            line: 7,
            suggestions: [
              {
                desc: "Remove the 'messages.nested.hello' key.",
                output: `{
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
            line: 12,
            suggestions: [
              {
                desc: "Remove the 'hello-dio' key.",
                output: `{
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
`
              },
              {
                desc: 'Remove all unused keys.',
                output: fixallJa
              }
            ]
          }
        ]
      )
    })

    it('should be detected unsued keys for constructor-option-format', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base'],
          settings: {
            'vue-i18n': {
              localeDir: { pattern: `./invalid/constructor-option-format/locales/*.json`, localeKey: 'key' }
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module'
        },
        rules: {
          '@intlify/vue-i18n/no-unused-keys': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)

      function getRuleErrors (path) {
        const fullPath = resolve(__dirname, path)
        const result = messages.results
          .find(result => result.filePath === fullPath)
        return result.messages.map(message => {
          assert.equal(message.ruleId, '@intlify/vue-i18n/no-unused-keys')
          return {
            message: message.message,
            line: message.line,
            suggestions: message.suggestions
              .map(suggest => {
                const output = SourceCodeFixer.applyFixes(result.source, [suggest]).output
                return {
                  desc: suggest.desc,
                  output
                }
              })
          }
        })
      }
      const fixall = `{
  "en": {
    "hello": "hello world",
    "messages": {
      "link": "@:message.hello",
      "nested": {
      }
    },
    "hello_dio": "hello underscore DIO!",
    "hello {name}": "hello {name}!"
  },
  "ja": {
    "hello": "ハローワールド",
    "messages": {
      "link": "@:message.hello",
      "nested": {
      }
    },
    "hello_dio": "こんにちは、アンダースコア DIO！",
    "hello {name}": "こんにちは、{name}！"
  }
}
`
      assert.deepStrictEqual(
        getRuleErrors('../../fixtures/no-unused-keys/invalid/constructor-option-format/locales/index.json'),
        [
          {
            message: "unused 'en.messages.hello' key",
            line: 5,
            suggestions: [
              {
                desc: "Remove the 'en.messages.hello' key.",
                output: `{
  "en": {
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
            message: "unused 'ja.messages.hello' key",
            line: 18,
            suggestions: [
              {
                desc: "Remove the 'ja.messages.hello' key.",
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
      )
    })
  })
})
