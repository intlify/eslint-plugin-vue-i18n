import cp from 'node:child_process'
import path from 'node:path'
import assert from 'node:assert'
import semver from 'semver'
import { readPackageJson } from './helper'

const ESLINT = `.${path.sep}node_modules${path.sep}.bin${path.sep}eslint`

describe('Integration with legacy config', () => {
  let originalCwd

  before(() => {
    originalCwd = process.cwd()
    process.chdir(path.join(__dirname, 'legacy-config'))
    cp.execSync('pnpm install', { stdio: 'inherit' })
  })
  after(() => {
    originalCwd && process.chdir(originalCwd)
  })

  it('should work with legacy config', async () => {
    if (
      !semver.satisfies(
        process.version,
        readPackageJson(
          path.resolve(__dirname, 'legacy-config/node_modules/eslint')
        ).engines.node
      )
    ) {
      return
    }
    const cliResult = cp.execSync(`${ESLINT} src/* --format=json`, {
      encoding: 'utf-8',
      env: { ESLINT_USE_FLAT_CONFIG: 'false' }
    })

    const result = JSON.parse(cliResult)
    const enJson = result.find(r => path.basename(r.filePath) === 'en.json')
    assert.strictEqual(enJson.messages.length, 1)
    assert.strictEqual(
      enJson.messages[0].ruleId,
      '@intlify/vue-i18n/no-html-messages'
    )
    const aVue = result.find(r => path.basename(r.filePath) === 'a.vue')
    assert.strictEqual(aVue.messages.length, 1)
    assert.strictEqual(
      aVue.messages[0].ruleId,
      '@intlify/vue-i18n/no-missing-keys'
    )
  })
})
