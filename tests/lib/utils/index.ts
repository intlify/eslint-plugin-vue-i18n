/**
 * @author Yosuke Ota
 */
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'node:path'
import { deepStrictEqual } from 'assert'
import { getLocaleMessages } from '../../../lib/utils/index'
import { setTimeouts } from '../../../lib/utils/default-timeouts'
import type {
  RuleContext,
  I18nLocaleMessageDictionary
} from '../../../lib/types'

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
  const parserServices = {}
  const dummyContext: RuleContext = {
    getFilename() {
      return 'input.vue'
    },
    getSourceCode() {
      return {
        ast: {},
        parserServices
      }
    },
    parserServices,
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
      deepStrictEqual(getAllLocaleMessages(), {
        'en.json': enJson
      })
      const newEnJson = { ...enJson, 'new-message': 'foo' }
      writeFileSync(enJsonPath, JSON.stringify(newEnJson, null, 2), 'utf8')
      await new Promise(resolve => setTimeout(resolve, 10))
      deepStrictEqual(getAllLocaleMessages(), {
        'en.json': newEnJson
      })

      const newJaJson = { 'new-message': 'hoge' }
      writeFileSync(jaJsonPath, JSON.stringify(newJaJson, null, 2), 'utf8')
      await new Promise(resolve => setTimeout(resolve, 20))
      deepStrictEqual(getAllLocaleMessages(), {
        'en.json': newEnJson,
        'ja.json': newJaJson
      })
    } finally {
      writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2), 'utf8')
      try {
        unlinkSync(jaJsonPath)
      } catch (_e) {
        // ignore
      }
    }
  })
})
