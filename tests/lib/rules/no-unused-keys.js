/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Module = require('module')
const { CLIEngine, RuleTester } = require('eslint')
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
      message: "unused 'messages.hello' key'",
      line: 6
    },
    {
      message: "unused 'messages.nested.hello' key'",
      line: 9
    },
    {
      message: "unused 'hello-dio' key'",
      line: 14
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
        baseConfig: {},
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['@intlify/vue-i18n'],
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
          settings: {
            'vue-i18n': {
              localeDir: `./valid/vue-cli-format/locales/*.json`
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['@intlify/vue-i18n'],
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
          settings: {
            'vue-i18n': {
              localeDir: { pattern: `./valid/constructor-option-format/locales/*.json`, localeKey: 'key' }
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['@intlify/vue-i18n'],
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
          settings: {
            'vue-i18n': {
              localeDir: `./invalid/vue-cli-format/locales/*.json`
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['@intlify/vue-i18n'],
        rules: {
          '@intlify/vue-i18n/no-unused-keys': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)

      function checkRuleId (path) {
        const fullPath = resolve(__dirname, path)
        const [result] = messages.results
          .filter(result => result.filePath === fullPath)
        result.messages.forEach(message => {
          assert.equal(message.ruleId, '@intlify/vue-i18n/no-unused-keys')
        })
      }
      checkRuleId('../../fixtures/no-unused-keys/invalid/vue-cli-format/locales/en.json')
      checkRuleId('../../fixtures/no-unused-keys/invalid/vue-cli-format/locales/ja.json')
    })

    it('should be detected unsued keys for constructor-option-format', () => {
      const linter = new CLIEngine({
        baseConfig: {
          settings: {
            'vue-i18n': {
              localeDir: { pattern: `./invalid/constructor-option-format/locales/*.json`, localeKey: 'key' }
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['@intlify/vue-i18n'],
        rules: {
          '@intlify/vue-i18n/no-unused-keys': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)

      function checkRuleId (path) {
        const fullPath = resolve(__dirname, path)
        const [result] = messages.results
          .filter(result => result.filePath === fullPath)
        result.messages.forEach(message => {
          assert.equal(message.ruleId, '@intlify/vue-i18n/no-unused-keys')
        })
      }
      checkRuleId('../../fixtures/no-unused-keys/invalid/constructor-option-format/locales/index.json')
    })
  })
})
