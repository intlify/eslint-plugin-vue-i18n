/**
 * @author Yosuke Ota
 */
import fs from 'fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'assert'
import { usedKeysCache } from '../../../lib/utils/collect-keys'
import { setTimeouts } from '../../../lib/utils/default-timeouts'
import semver from 'semver'
import eslintPackageJson from 'eslint/package.json' assert { type: 'json' }

describe('usedKeysCache', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- ignore
  if (!semver.satisfies(eslintPackageJson.version, '>=6')) {
    return
  }
  before(() => {
    setTimeouts({
      CACHE_LOADER: 10,
      MTIME_MS_CHECK: 4
    })
  })

  after(() => {
    setTimeouts({
      CACHE_LOADER: 1000,
      MTIME_MS_CHECK: 300
    })
  })

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const filesDir = join(__dirname, '../../fixtures/utils/collect-keys/src')

  function collectKeysFromFiles() {
    return usedKeysCache.collectKeysFromFiles(
      [filesDir],
      ['.vue', '.js'],
      {} as never
    )
  }
  it('should be refresh with change files.', async () => {
    const vuePath = join(
      __dirname,
      '../../fixtures/utils/collect-keys/src/App.vue'
    )
    const jsPath = join(
      __dirname,
      '../../fixtures/utils/collect-keys/src/main.js'
    )
    const bkVue = fs.readFileSync(vuePath, 'utf8')
    try {
      assert.deepStrictEqual(collectKeysFromFiles(), [
        'hello_dio',
        'messages.link',
        'hello {name}'
      ])
      fs.writeFileSync(
        vuePath,
        `<template><div id="app">{{ $t('messages.link') }}</div></template>`
      )
      await new Promise(resolve => setTimeout(resolve, 10))
      assert.deepStrictEqual(collectKeysFromFiles(), ['messages.link'])

      fs.writeFileSync(jsPath, "const $t = () => {}\n$t('hello')\n", 'utf8')
      await new Promise(resolve => setTimeout(resolve, 20))
      assert.deepStrictEqual(collectKeysFromFiles(), ['hello', 'messages.link'])
    } finally {
      fs.writeFileSync(vuePath, bkVue, 'utf8')
      try {
        fs.unlinkSync(jsPath)
      } catch (_e) {
        // ignore
      }
    }
  })
})
