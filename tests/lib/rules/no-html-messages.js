/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Module = require('module')
const { CLIEngine } = require('eslint')
const { resolve, join } = require('path')
const assert = require('assert')

describe('no-html-messages', () => {
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
          settings: {
            'vue-i18n': {
              localeDir: `./valid/*.json`
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['vue-i18n'],
        rules: {
          'vue-i18n/no-html-messages': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 0)
    })
  })

  describe('invalid', () => {
    it('should be detected html messages', () => {
      const linter = new CLIEngine({
        baseConfig: {
          settings: {
            'vue-i18n': {
              localeDir: `./invalid/*.json`
            }
          }
        },
        parser: require.resolve('vue-eslint-parser'),
        parserOptions: {
          ecmaVersion: 2015
        },
        plugins: ['vue-i18n'],
        rules: {
          'vue-i18n/no-html-messages': 'error'
        },
        extensions: ['.js', '.vue', '.json']
      })

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 3)

      function checkRuleId (path) {
        const fullPath = resolve(__dirname, path)
        const [result] = messages.results
          .filter(result => result.filePath === fullPath)
        result.messages.forEach(message => {
          assert.equal(message.ruleId, 'vue-i18n/no-html-messages')
        })
      }
      checkRuleId('../../fixtures/no-html-messages/invalid/en.json')
    })
  })
})
