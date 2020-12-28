/**
 * @author Yosuke Ota
 */
import assert from 'assert'
import * as utils from '../../../../lib/utils/message-compiler/utils'
import type { RuleContext } from '../../../../lib/types'
import { getStaticYAMLValue, parseYAML } from 'yaml-eslint-parser'
import { getStaticJSONValue, parseJSON } from 'jsonc-eslint-parser'

describe('message-compiler utils', () => {
  describe('getMessageSyntaxVersions', () => {
    function get(v: string) {
      const data = utils.getMessageSyntaxVersions({
        settings: { 'vue-i18n': { messageSyntaxVersion: v } }
      } as RuleContext)
      // @ts-expect-error -- test
      delete data.reportIfMissingSetting
      return data
    }
    it('should be equal to the expected value', () => {
      assert.deepStrictEqual(get('^8.0.0'), {
        v8: true,
        v9: false,
        isNotSet: false
      })
      assert.deepStrictEqual(get('^9.0.0'), {
        v8: false,
        v9: true,
        isNotSet: false
      })
      assert.deepStrictEqual(get('^7.0.0'), {
        v8: true,
        v9: false,
        isNotSet: false
      })
      assert.deepStrictEqual(get('^10.0.0'), {
        v8: false,
        v9: true,
        isNotSet: false
      })
      assert.deepStrictEqual(get('>=5.0.0'), {
        v8: true,
        v9: true,
        isNotSet: false
      })
      assert.deepStrictEqual(get('^9.0.0-beta.8'), {
        v8: false,
        v9: true,
        isNotSet: false
      })
    })
  })

  describe('getJSONStringOffset', () => {
    function split(code: TemplateStringsArray | string, invalid?: boolean) {
      const raw = typeof code === 'string' ? code : String.raw(code)
      const result = []
      let start = 0
      for (let index = 0; index < raw.length; index++) {
        const offset = utils.getJSONStringOffset(raw, index + 1)
        if (start === offset && raw.length <= offset) {
          break
        }
        const s = raw.slice(start, offset)
        result.push(s + '?'.repeat(offset - start - s.length))
        start = offset
      }
      if (!invalid) {
        const val = getStaticJSONValue(parseJSON(`"${raw}"`)) as string
        assert.strictEqual(result.length, val.length, JSON.stringify(val))
      }
      return result
    }
    it('should be equal to the expected value', () => {
      assert.strictEqual(utils.getJSONStringOffset(String.raw`a`, 0), 0)
      assert.strictEqual(utils.getJSONStringOffset(String.raw`\n`, 0), 0)
      assert.strictEqual(utils.getJSONStringOffset(String.raw`a`, 4), 1)
      assert.strictEqual(utils.getJSONStringOffset(String.raw`\n`, 4), 2)
      assert.deepStrictEqual(split`\n`, ['\\n'])
      assert.deepStrictEqual(split`abc\\def`, [
        'a',
        'b',
        'c',
        '\\\\',
        'd',
        'e',
        'f'
      ])
      assert.deepStrictEqual(split`a\xA9b`, ['a', '\\xA9', 'b'])
      assert.deepStrictEqual(split`a\u00A9b`, ['a', '\\u00A9', 'b'])
      assert.deepStrictEqual(split`a\u{A9}b`, ['a', '\\u{A9}', 'b'])
      assert.deepStrictEqual(split`a\u{00A9}b`, ['a', '\\u{00A9}', 'b'])
      assert.deepStrictEqual(split`a\u{2F804}b`, ['a', '\\u{2F804}', '', 'b'])
      assert.deepStrictEqual(split`a\u{10000}b`, ['a', '\\u{10000}', '', 'b'])
      assert.deepStrictEqual(split`a\u{ffff}b`, ['a', '\\u{ffff}', 'b'])
      assert.deepStrictEqual(split`a\251b`, ['a', '\\251', 'b'])
      assert.deepStrictEqual(split`a\0b`, ['a', '\\0', 'b'])
      assert.deepStrictEqual(split`\7777`, ['\\77', '7', '7'])
      assert.deepStrictEqual(split`\66A`, ['\\66', 'A'])
      assert.deepStrictEqual(split`a\n\\\0\q\xA9\u00A9\u{2F804}\251`, [
        'a',
        '\\n',
        '\\\\',
        '\\0',
        '\\q',
        '\\xA9',
        '\\u00A9',
        '\\u{2F804}',
        '',
        '\\251'
      ])
      // invalid strings
      assert.deepStrictEqual(split('\\', true), ['\\'])
      assert.deepStrictEqual(split('\\x', true), ['\\x'])
      assert.deepStrictEqual(split('\\x1', true), ['\\x1'])
      assert.deepStrictEqual(split('\\u', true), ['\\u'])
      assert.deepStrictEqual(split('\\u0', true), ['\\u0'])
      assert.deepStrictEqual(split('\\u00', true), ['\\u00'])
      assert.deepStrictEqual(split('\\u000', true), ['\\u000'])
      assert.deepStrictEqual(split('\\u{', true), ['\\u{'])
      assert.deepStrictEqual(split('\\u{123', true), ['\\u{123'])
    })
  })

  describe('getYAMLSingleQuotedStringOffset', () => {
    function split(code: string, invalid?: boolean) {
      const result = []
      let start = 0
      for (let index = 0; index < code.length; index++) {
        const offset = utils.getYAMLSingleQuotedStringOffset(code, index + 1)
        if (start === offset && code.length <= offset) {
          break
        }
        const s = code.slice(start, offset)
        result.push(s + '?'.repeat(offset - start - s.length))
        start = offset
      }
      if (!invalid) {
        const val = getStaticYAMLValue(parseYAML(`'${code}'`)) as string
        assert.strictEqual(result.length, val.length, JSON.stringify(val))
      }
      return result
    }
    it('should be equal to the expected value', () => {
      assert.strictEqual(utils.getYAMLSingleQuotedStringOffset(`a`, 0), 0)
      assert.strictEqual(utils.getYAMLSingleQuotedStringOffset(`''`, 0), 0)
      assert.strictEqual(utils.getYAMLSingleQuotedStringOffset(`a`, 4), 1)
      assert.strictEqual(utils.getYAMLSingleQuotedStringOffset(`''`, 4), 2)
      assert.deepStrictEqual(split('abc'), ['a', 'b', 'c'])
      assert.deepStrictEqual(split("''"), ["''"])
      assert.deepStrictEqual(split("it''s"), ['i', 't', "''", 's'])
      assert.deepStrictEqual(split(' 1st a\n\n 2nd b \n\t3rd c '), [
        ' ',
        '1',
        's',
        't',
        ' ',
        'a',
        '\n\n ',
        '2',
        'n',
        'd',
        ' ',
        'b',
        ' \n\t',
        '3',
        'r',
        'd',
        ' ',
        'c',
        ' '
      ])
      assert.deepStrictEqual(split('  a  b  '), [
        ' ',
        ' ',
        'a',
        ' ',
        ' ',
        'b',
        ' ',
        ' '
      ])
      assert.deepStrictEqual(split('b\n  '), ['b', '\n  '])
      assert.deepStrictEqual(split('b\n\n  '), ['b', '\n\n  '])
      assert.deepStrictEqual(split('b\n\n\n  '), ['b', '\n\n', '\n  '])

      // invalid strings
      assert.deepStrictEqual(split("a'", true), ['a', "'"])
    })
  })

  describe('getYAMLDoubleQuotedStringOffset', () => {
    function split(code: string, invalid?: boolean) {
      const result = []
      let start = 0
      for (let index = 0; index < code.length; index++) {
        const offset = utils.getYAMLDoubleQuotedStringOffset(code, index + 1)
        if (start === offset && code.length <= offset) {
          break
        }
        const s = code.slice(start, offset)
        result.push(s + '?'.repeat(offset - start - s.length))
        start = offset
      }
      if (!invalid) {
        const val = getStaticYAMLValue(parseYAML(`"${code}"`)) as string
        assert.strictEqual(result.length, val.length, JSON.stringify(val))
      }
      return result
    }
    it('should be equal to the expected value', () => {
      assert.strictEqual(utils.getYAMLDoubleQuotedStringOffset(`a`, 0), 0)
      assert.strictEqual(utils.getYAMLDoubleQuotedStringOffset(`\\n`, 0), 0)
      assert.strictEqual(utils.getYAMLDoubleQuotedStringOffset(`a`, 4), 1)
      assert.strictEqual(utils.getYAMLDoubleQuotedStringOffset(`\\n`, 4), 2)
      assert.deepStrictEqual(split('abc'), ['a', 'b', 'c'])
      assert.deepStrictEqual(split('\\t'), ['\\t'])
      assert.deepStrictEqual(split('a\\tb  c'), [
        'a',
        '\\t',
        'b',
        ' ',
        ' ',
        'c'
      ])
      assert.deepStrictEqual(split('a\\\nb'), ['a', '\\\nb'])
      assert.deepStrictEqual(split('a\\\n     b'), ['a', '\\\n     b'])
      assert.deepStrictEqual(split('f \nt\t\n \ne \t\\\n \\ \te'), [
        'f',
        ' \n',
        't',
        '\t\n \n',
        'e',
        ' ',
        '\t',
        '\\\n \\ ',
        '\t',
        'e'
      ])
      assert.deepStrictEqual(split('  a  b  '), [
        ' ',
        ' ',
        'a',
        ' ',
        ' ',
        'b',
        ' ',
        ' '
      ])
      assert.deepStrictEqual(split('b\n  '), ['b', '\n  '])
      assert.deepStrictEqual(split('b\n\n  '), ['b', '\n\n  '])
      assert.deepStrictEqual(split('b\n\n\n  '), ['b', '\n\n', '\n  '])
      assert.deepStrictEqual(split('\\U000000A9'), ['\\U000000A9'])
      assert.deepStrictEqual(split('\\U0000FFFF'), ['\\U0000FFFF'])
      assert.deepStrictEqual(split('\\U000100000'), ['\\U00010000', '', '0'])
      assert.deepStrictEqual(split('\\U00010000Z'), ['\\U00010000', '', 'Z'])
      assert.deepStrictEqual(split('a\\xA9\\u00A9\\U0002F804Z'), [
        'a',
        '\\xA9',
        '\\u00A9',
        '\\U0002F804',
        '',
        'Z'
      ])
      assert.deepStrictEqual(split('a\\xA90\\u00A90\\U0002F8040'), [
        'a',
        '\\xA9',
        '0',
        '\\u00A9',
        '0',
        '\\U0002F804',
        '',
        '0'
      ])

      // invalid strings
      assert.deepStrictEqual(split('a\\', true), ['a', '\\'])
    })
  })

  describe('getYAMLPlainStringOffset', () => {
    function split(code: string, invalid?: boolean) {
      const result = []
      let start = 0
      for (let index = 0; index < code.length; index++) {
        const offset = utils.getYAMLPlainStringOffset(code, index + 1)
        if (start === offset && code.length <= offset) {
          break
        }
        const s = code.slice(start, offset)
        result.push(s + '?'.repeat(offset - start - s.length))
        start = offset
      }
      if (!invalid) {
        const val = getStaticYAMLValue(parseYAML(`${code}`)) as string
        assert.strictEqual(result.length, val.length, JSON.stringify(val))
      }
      return result
    }
    it('should be equal to the expected value', () => {
      assert.strictEqual(utils.getYAMLPlainStringOffset(`a`, 0), 0)
      assert.strictEqual(utils.getYAMLPlainStringOffset(`a`, 4), 1)
      assert.deepStrictEqual(split('abc'), ['a', 'b', 'c'])
      assert.deepStrictEqual(split('\\t'), ['\\', 't'])
      assert.deepStrictEqual(split('a b  c'), ['a', ' ', 'b', ' ', ' ', 'c'])
      assert.deepStrictEqual(split('a\\\nb'), ['a', '\\', '\n', 'b'])
      assert.deepStrictEqual(split('a\\\n     b'), ['a', '\\', '\n     ', 'b'])
      assert.deepStrictEqual(split('a\n  \n  \n   b'), [
        'a',
        '\n  \n  ',
        '\n   ',
        'b'
      ])
      assert.deepStrictEqual(split('f \nt\t\n \ne \t\\\n \\ \te'), [
        'f',
        ' \n',
        't',
        '\t\n \n',
        'e',
        ' ',
        '\t',
        '\\',
        '\n ',
        '\\',
        ' ',
        '\t',
        'e'
      ])
      assert.deepStrictEqual(split('a  b'), ['a', ' ', ' ', 'b'])

      // invalid strings
      assert.deepStrictEqual(split('a\\', true), ['a', '\\'])
      assert.deepStrictEqual(split(' a b ', true), [' ', 'a', ' ', 'b', ' '])
      assert.deepStrictEqual(split(' a b\n\n\n ', true), [
        ' ',
        'a',
        ' ',
        'b',
        '\n\n',
        '\n '
      ])
    })
  })
})
