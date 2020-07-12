'use strict'

const cp = require('child_process')
const path = require('path')
const assert = require('assert')

const TEST_CWD = path.join(__dirname, 'config-recommended')

describe('Integration with "plugin:@intlify/vue-i18n/recommended"', () => {
  let originalCwd

  before(() => {
    originalCwd = process.cwd()
    process.chdir(TEST_CWD)
    cp.execSync('npm i', { stdio: 'inherit' })
  })
  after(() => {
    process.chdir(originalCwd)
  })

  it('should work with shareable config', () => {
    const CLIEngine = require('./config-recommended/node_modules/eslint').CLIEngine
    const engine = new CLIEngine({
      cwd: TEST_CWD,
      extensions: ['.js', '.vue', '.json']
    })
    const result = engine.executeOnFiles(['./src'])
    const enJson = result.results.find(r => path.basename(r.filePath) === 'en.json')
    assert.strictEqual(enJson.messages.length, 1)
    assert.strictEqual(enJson.messages[0].ruleId, '@intlify/vue-i18n/no-html-messages')
    const aVue = result.results.find(r => path.basename(r.filePath) === 'a.vue')
    assert.strictEqual(aVue.messages.length, 1)
    assert.strictEqual(aVue.messages[0].ruleId, '@intlify/vue-i18n/no-missing-keys')
  })
})
