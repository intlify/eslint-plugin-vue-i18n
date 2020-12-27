/**
 * @author Yosuke Ota
 */
import assert from 'assert'
import * as utils from '../../../../lib/utils/message-compiler/utils'
import type { RuleContext } from '../../../../lib/types'

describe('message-compiler utils', () => {
  describe('getMessageSyntaxVersions', () => {
    function get(v: string) {
      return utils.getMessageSyntaxVersions({
        settings: { 'vue-i18n': { messageSyntaxVersion: v } }
      } as RuleContext)
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
})
