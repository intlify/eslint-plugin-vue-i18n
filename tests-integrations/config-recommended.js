'use strict'

const cp = require('child_process')
const path = require('path')
const assert = require('assert')

const TEST_CWD = path.join(__dirname, 'config-recommended')

describe('Integration with "plugin:vue-i18n-ex/recommended"', () => {
  let originalCwd

  before(() => {
    originalCwd = process.cwd()
    process.chdir(TEST_CWD)
    cp.execSync('yarn', { stdio: 'inherit' })
  })
  after(() => {
    process.chdir(originalCwd)
  })

  it('should work with shareable config', async () => {
    const ESLint = require('./config-recommended/node_modules/eslint').ESLint
    const engine = new ESLint({
      cwd: TEST_CWD,
      extensions: ['.js', '.vue', '.json']
    })
    const results = await engine.lintFiles(['./src'])
    const enJson = results.find(r => path.basename(r.filePath) === 'en.json')
    assert.strictEqual(enJson.messages.length, 1)
    assert.strictEqual(
      enJson.messages[0].ruleId,
      'vue-i18n-ex/no-html-messages'
    )
    const aVue = results.find(r => path.basename(r.filePath) === 'a.vue')
    assert.strictEqual(aVue.messages.length, 1)
    assert.strictEqual(aVue.messages[0].ruleId, 'vue-i18n-ex/no-missing-keys')
  })
})
