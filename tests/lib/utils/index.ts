/**
 * @author Yosuke Ota
 */
import fs from 'fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'assert'
import { getLocaleMessages } from '../../../lib/utils/index'
import { setTimeouts } from '../../../lib/utils/default-timeouts'
import type {
  RuleContext,
  I18nLocaleMessageDictionary
} from '../../../lib/types'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

describe('getLocaleMessages', () => {
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

  const localeDir = 'tests/fixtures/utils/get-locale-messages/**/*.json'
  const dummyContext: RuleContext = {
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
  } as never
  function getAllLocaleMessages() {
    const r: {
      [file: string]: I18nLocaleMessageDictionary
    } = {}
    for (const localeMessage of getLocaleMessages(dummyContext)
      .localeMessages) {
      r[localeMessage.file] = localeMessage.messages
    }
    return r
  }
  it('should be refresh with change files.', async () => {
    const enJsonPath = join(
      __dirname,
      '../../fixtures/utils/get-locale-messages/locales/en.json'
    )
    const jaJsonPath = join(
      __dirname,
      '../../fixtures/utils/get-locale-messages/locales/ja.json'
    )
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
