/**
 * @author Yosuke Ota
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'node:path'
import { deepStrictEqual } from 'assert'
import { usedKeysCache } from '../../../lib/utils/collect-keys'
import { setTimeouts } from '../../../lib/utils/default-timeouts'
import { satisfies } from 'semver'
import { version } from 'eslint/package.json'

describe('usedKeysCache', () => {
  if (!satisfies(version, '>=6')) {
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
    const bkVue = readFileSync(vuePath, 'utf8')
    try {
      deepStrictEqual(collectKeysFromFiles(), [
        'hello_dio',
        'messages.link',
        'hello {name}'
      ])
      writeFileSync(
        vuePath,
        `<template><div id="app">{{ $t('messages.link') }}</div></template>`
      )
      await new Promise(resolve => setTimeout(resolve, 10))
      deepStrictEqual(collectKeysFromFiles(), ['messages.link'])

      writeFileSync(jsPath, "const $t = () => {}\n$t('hello')\n", 'utf8')
      await new Promise(resolve => setTimeout(resolve, 20))
      deepStrictEqual(collectKeysFromFiles(), ['hello', 'messages.link'])
    } finally {
      writeFileSync(vuePath, bkVue, 'utf8')
      try {
        unlinkSync(jsPath)
      } catch (_e) {
        // ignore
      }
    }
  })
})
