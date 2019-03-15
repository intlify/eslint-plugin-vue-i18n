/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Module = require('module')
const { CLIEngine } = require('eslint')
const { resolve, join } = require('path')
const assert = require('assert')

const baseDir = './locales'

const linter = new CLIEngine({
  baseConfig: {
    settings: {
      'vue-i18n': {
        localeDir: `${baseDir}/*.json`
      }
    }
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2015
  },
  plugins: ['vue-i18n'],
  rules: {
    'vue-i18n/no-unused-keys': 'error'
  },
  useEslintrc: true,
  extensions: ['.js', '.vue', '.json']
})

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
    const p = join(__dirname, '../../fixtures')
    process.chdir(p)
  })

  after(() => {
    process.chdir(originalCwd)
  })

  it('should be detected unsued keys', () => {
    const messages = linter.executeOnFiles(['.'])
    assert.equal(messages.errorCount, 6)
    const enFullPath = resolve(__dirname, '../../fixtures/locales/en.json')
    const [enResult] = messages.results
      .filter(result => result.filePath === enFullPath)
    enResult.messages.forEach(message => {
      assert.equal(message.ruleId, 'vue-i18n/no-unused-keys')
    })
    const jaFullPath = resolve(__dirname, '../../fixtures/locales/ja.json')
    const [jaResult] = messages.results
      .filter(result => result.filePath === jaFullPath)
    jaResult.messages.forEach(message => {
      assert.equal(message.ruleId, 'vue-i18n/no-unused-keys')
    })
  })
})
