/**
 * @author Kazuya Kawaguchi
 */
import path from 'path'
import assert from 'assert'
import { FileLocaleMessage } from '../../../lib/utils/locale-messages'

describe('FileLocaleMessage', () => {
  describe('localeKey: "file"', () => {
    it('locales should be resolved', () => {
      const testFilePath = path.resolve(
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
      const testFilePath = path.resolve(
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
      const testFilePath = path.resolve(
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

  describe('localeKey: "path" with includeFilenameInKey = true', () => {
    it('messages returned should be keyed by the filename', () => {
      const testFilePath = path.resolve(
        __dirname,
        '../../fixtures/utils/locale-messages/locales/en/message.json'
      )
      const messages = new FileLocaleMessage({
        fullpath: testFilePath,
        localeKey: 'path',
        localePattern: /^.*\/(?<locale>[A-Za-z0-9-_]+)\/.*\.(json5?|ya?ml)$/,
        includeFilenameInKey: true
      })
      assert.deepStrictEqual(Object.keys(messages.messages), ['message'])
      assert.deepStrictEqual(Object.keys(messages.messages['message'] || {}), [
        'hello'
      ])
    })
  })
})
