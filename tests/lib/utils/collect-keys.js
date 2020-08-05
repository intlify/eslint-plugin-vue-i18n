/**
 * @author Yosuke Ota
 */
'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { usedKeysCache } = require('../../../lib/utils/collect-keys')
const defaultTimeouts = require('../../../lib/utils/default-timeouts')

describe('usedKeysCache', () => {
  before(() => {
    defaultTimeouts.CACHE_LOADER = 10
    defaultTimeouts.MTIME_MS_CHECK = 4
  })

  after(() => {
    defaultTimeouts.CACHE_LOADER = 1000
    defaultTimeouts.MTIME_MS_CHECK = 300
  })

  const filesDir = path.join(__dirname, '../../fixtures/utils/collect-keys/src')

  function collectKeysFromFiles () {
    return usedKeysCache.collectKeysFromFiles([filesDir], ['.vue', '.js'])
  }
  it('should be refresh with change files.', async () => {
    const vuePath = path.join(__dirname, '../../fixtures/utils/collect-keys/src/App.vue')
    const jsPath = path.join(__dirname, '../../fixtures/utils/collect-keys/src/main.js')
    const bkVue = fs.readFileSync(vuePath, 'utf8')
    try {
      assert.deepStrictEqual(collectKeysFromFiles(), ['hello_dio', 'messages.link', 'hello {name}'])
      fs.writeFileSync(vuePath, `<template><div id="app">{{ $t('messages.link') }}</div></template>`)
      await new Promise(resolve => setTimeout(resolve, 10))
      assert.deepStrictEqual(collectKeysFromFiles(), ['messages.link'])

      fs.writeFileSync(jsPath, 'const $t = () => {}\n$t(\'hello\')\n', 'utf8')
      await new Promise(resolve => setTimeout(resolve, 20))
      assert.deepStrictEqual(collectKeysFromFiles(), ['messages.link', 'hello'])
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
