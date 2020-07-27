/**
 * @author Yosuke Ota
 */
'use strict'

const assert = require('assert')
const defineCacheFunction = require('../../../lib/utils/cache-function')

describe('defineCacheFunction', () => {
  it('should be refresh with change arguments.', () => {
    let count = 0
    const fn = defineCacheFunction(() => {
      const res = ++count
      return res
    }, 5)
    const before = fn(1)
    assert.strictEqual(fn(1), before)
    assert.strictEqual(fn(2), before + 1)
  })
})
