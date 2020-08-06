/**
 * @author Yosuke Ota
 */
import assert from 'assert'
import { defineCacheFunction } from '../../../lib/utils/cache-function'

describe('defineCacheFunction', () => {
  it('should be refresh with change arguments.', () => {
    let count = 0
    const fn = defineCacheFunction<[number], number>(() => {
      const res = ++count
      return res
    })
    const before = fn(1)
    assert.strictEqual(fn(1), before)
    assert.strictEqual(fn(2), before + 1)
  })
})
