/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Module = require('module')
const { CLIEngine, RuleTester } = require('eslint')
const { resolve, join } = require('path')
const fs = require('fs')
const assert = require('assert')
const rule = require('../../../lib/rules/no-html-messages')

new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
}).run('no-html-messages', rule, {
  valid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n>${fs
        .readFileSync(
          require.resolve('../../fixtures/no-html-messages/valid/en.json'),
          'utf8'
        )
        .replace(/</g, '&lt;')}</i18n>
    <template></template><script></script>`
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
    }
  ],
  invalid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n>${fs
        .readFileSync(
          require.resolve('../../fixtures/no-html-messages/invalid/en.json'),
          'utf8'
        )
        .replace(/</g, '&lt;')}</i18n>
    <template></template><script></script>`,
      errors: [
        {
          message: 'used HTML localization message',
          line: 3,
          column: 14
        },
        {
          message: 'used HTML localization message',
          line: 5,
          column: 24
        },
        {
          message: 'used HTML localization message',
          line: 6,
          column: 22
        }
      ]
    },
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n lang="yaml">${fs
        .readFileSync(
          require.resolve('../../fixtures/no-html-messages/invalid/en.yaml'),
          'utf8'
        )
        .replace(/</g, '&lt;')}</i18n>
    <template></template><script></script>`,
      errors: [
        {
          message: 'used HTML localization message',
          line: 2,
          column: 12
        },
        {
          message: 'used HTML localization message',
          line: 4,
          column: 22
        },
        {
          message: 'used HTML localization message',
          line: 5,
          column: 20
        }
      ]
    }
  ]
})

describe('no-html-messages with fixtures', () => {
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
    const p = join(__dirname, '../../fixtures/no-html-messages')
    process.chdir(p)
  })

  after(() => {
    Module._resolveFilename = resolveFilename
    process.chdir(originalCwd)
  })

  describe('valid', () => {
    it('should be not detected html messages', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base'],
          settings: {
            'vue-i18n': {
              localeDir: `./valid/*.{json,yaml,yml}`
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015
        },
        rules: {
          '@intlify/vue-i18n/no-html-messages': 'error'
        },
        extensions: ['.js', '.vue', '.json', '.yaml', '.yml']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 0)
    })
  })

  describe('invalid', () => {
    it('should be detected html messages', () => {
      const linter = new CLIEngine({
        baseConfig: {
          extends: ['plugin:@intlify/vue-i18n/base'],
          settings: {
            'vue-i18n': {
              localeDir: `./invalid/*.{json,yaml,yml}`
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015
        },
        rules: {
          '@intlify/vue-i18n/no-html-messages': 'error'
        },
        extensions: ['.js', '.vue', '.json', '.yaml', '.yml']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)

      function checkRuleId(path) {
        const fullPath = resolve(__dirname, path)
        const result = messages.results.find(
          result => result.filePath === fullPath
        )
        assert.equal(result.messages.length, 3)
        result.messages.forEach(message => {
          assert.equal(message.ruleId, '@intlify/vue-i18n/no-html-messages')
        })
      }
      checkRuleId('../../fixtures/no-html-messages/invalid/en.json')
      checkRuleId('../../fixtures/no-html-messages/invalid/en.yaml')
    })
  })
})
