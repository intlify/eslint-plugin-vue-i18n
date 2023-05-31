/**
 * @author Kazuya Kawaguchi
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'assert'
import { FileLocaleMessage } from '../../../lib/utils/locale-messages'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('FileLocaleMessage', () => {
  describe('localeKey: "file"', () => {
    it('locales should be resolved', () => {
      const testFilePath = resolve(
        __dirname,
        '../../fixtures/utils/locale-messages/locales/en.yaml'
      )
      const messages = new FileLocaleMessage({
        fullpath: testFilePath,
        localeKey: 'file'
      })
      assert.deepStrictEqual(messages.locales, ['en'])
    })
  })

  describe('localeKey: "path"', () => {
    it('locales should be resolved', () => {
      const testFilePath = resolve(
        __dirname,
        '../../fixtures/utils/locale-messages/locales/en/message.json'
      )
      const messages = new FileLocaleMessage({
        fullpath: testFilePath,
        localeKey: 'path',
        localePattern: /^.*\/(?<locale>[A-Za-z0-9-_]+)\/.*\.(json5?|ya?ml)$/
      })
      assert.deepStrictEqual(messages.locales, ['en'])
    })
  })

  describe('localeKey: "key"', () => {
    it('locales should be resolved', () => {
      const testFilePath = resolve(
        __dirname,
        '../../fixtures/utils/locale-messages/locales/message.json5'
      )
      const messages = new FileLocaleMessage({
        fullpath: testFilePath,
        localeKey: 'key'
      })
      assert.deepStrictEqual(messages.locales, ['en', 'ja'])
    })
  })
})
