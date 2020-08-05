/**
 * @author Yosuke Ota
 */
'use strict'

const assert = require('assert')
const CacheLoader = require('../../../lib/utils/cache-loader')

describe('CacheLoader', () => {
  it('should be refresh it regularly.', async () => {
    let count = 0
    const loader = new CacheLoader(() => {
      const res = ++count
      return res
    }, 5)
    const before = loader.get()
    assert.strictEqual(loader.get(), before)
    await new Promise(resolve => setTimeout(resolve, 10))
    assert.strictEqual(loader.get(), before + 1)
  })
  it('should be refresh with change arguments.', () => {
    let count = 0
    const loader = new CacheLoader(() => {
      const res = ++count
      return res
    }, 5)
    const before = loader.get(1)
    assert.strictEqual(loader.get(1), before)
    assert.strictEqual(loader.get(2), before + 1)
  })
})
