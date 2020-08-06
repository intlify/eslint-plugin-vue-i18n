/**
 * @author Yosuke Ota
 */
'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { getLocaleMessages } = require('../../../lib/utils/index')
const defaultTimeouts = require('../../../lib/utils/default-timeouts')

describe('getLocaleMessages', () => {
  before(() => {
    defaultTimeouts.CACHE_LOADER = 10
    defaultTimeouts.MTIME_MS_CHECK = 4
  })

  after(() => {
    defaultTimeouts.CACHE_LOADER = 1000
    defaultTimeouts.MTIME_MS_CHECK = 300
  })

  const localeDir = 'tests/fixtures/utils/get-locale-messages/**/*.json'
  const dummyContext = {
    getFilename() {
      return 'input.vue'
    },
    getSourceCode() {
      return {
        ast: {}
      }
    },
    parserServices: {},
    settings: {
      'vue-i18n': {
        localeDir
      }
    }
  }
  function getAllLocaleMessages() {
    const r = {}
    for (const localeMessage of getLocaleMessages(dummyContext)
      .localeMessages) {
      r[localeMessage.file] = localeMessage.messages
    }
    return r
  }
  it('should be refresh with change files.', async () => {
    const enJsonPath = path.join(
      __dirname,
      '../../fixtures/utils/get-locale-messages/locales/en.json'
    )
    const jaJsonPath = path.join(
      __dirname,
      '../../fixtures/utils/get-locale-messages/locales/ja.json'
    )
    const enJson = require(enJsonPath)
    try {
      assert.deepStrictEqual(getAllLocaleMessages(), {
        'en.json': enJson
      })
      const newEnJson = { ...enJson, 'new-message': 'foo' }
      fs.writeFileSync(enJsonPath, JSON.stringify(newEnJson, null, 2), 'utf8')
      await new Promise(resolve => setTimeout(resolve, 10))
      assert.deepStrictEqual(getAllLocaleMessages(), {
        'en.json': newEnJson
      })

      const newJaJson = { 'new-message': 'hoge' }
      fs.writeFileSync(jaJsonPath, JSON.stringify(newJaJson, null, 2), 'utf8')
      await new Promise(resolve => setTimeout(resolve, 20))
      assert.deepStrictEqual(getAllLocaleMessages(), {
        'en.json': newEnJson,
        'ja.json': newJaJson
      })
    } finally {
      fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2), 'utf8')
      try {
        fs.unlinkSync(jaJsonPath)
      } catch (_e) {
        // ignore
      }
    }
  })
})
