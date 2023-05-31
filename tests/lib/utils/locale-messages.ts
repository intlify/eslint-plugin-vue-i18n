/**
 * @author Kazuya Kawaguchi
 */
import { resolve } from 'node:path'
import { deepStrictEqual } from 'assert'
import { FileLocaleMessage } from '../../../lib/utils/locale-messages'

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
      deepStrictEqual(messages.locales, ['en'])
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
      deepStrictEqual(messages.locales, ['en'])
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
      deepStrictEqual(messages.locales, ['en', 'ja'])
    })
  })
})
