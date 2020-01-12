/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Module = require('module')
const { CLIEngine } = require('eslint')
const { resolve, join } = require('path')
const assert = require('assert')

describe('no-unused-keys', () => {
  let originalCwd
  const resolveFilename = Module._resolveFilename

  before(() => {
    Module._resolveFilename = function (id) {
      if (id === 'eslint-plugin-vue-i18n') {
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
        plugins: ['vue-i18n'],
        rules: {
          'vue-i18n/no-unused-keys': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 4)
      messages.results.map(result => {
        return result.messages
          .filter(message => message.ruleId === 'vue-i18n/no-unused-keys')
      }).reduce((values, current) => values.concat(current), [])
        .forEach(message => {
          assert.equal(message.message, 'You need to define locales in settings. See the eslint-plugin-vue-i18n documentation')
        })
    })
  })

  describe('valid', () => {
    it('should be not detected unsued keys', () => {
      const linter = new CLIEngine({
        baseConfig: {
          settings: {
            'vue-i18n': {
              localeDir: `./valid/locales/*.json`
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['vue-i18n'],
        rules: {
          'vue-i18n/no-unused-keys': ['error', {
            src: resolve(__dirname, '../../fixtures/no-unused-keys/valid')
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
              localeDir: `./invalid/locales/*.json`
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['vue-i18n'],
        rules: {
          'vue-i18n/no-unused-keys': 'error'
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
          assert.equal(message.ruleId, 'vue-i18n/no-unused-keys')
        })
      }
      checkRuleId('../../fixtures/no-unused-keys/invalid/locales/en.json')
      checkRuleId('../../fixtures/no-unused-keys/invalid/locales/ja.json')
    })
  })
})
