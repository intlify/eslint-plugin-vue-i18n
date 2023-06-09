/**
 * @author Yosuke Ota
 */
import { strictEqual } from 'assert'
import { CacheLoader } from '../../../lib/utils/cache-loader'

describe('CacheLoader', () => {
  it('should be refresh it regularly.', async () => {
    let count = 0
    const loader = new CacheLoader(() => {
      const res = ++count
      return res
    }, 5)
    const before = loader.get()
    strictEqual(loader.get(), before)
    await new Promise(resolve => setTimeout(resolve, 10))
    strictEqual(loader.get(), before + 1)
  })
  it('should be refresh with change arguments.', () => {
    let count = 0
    const loader = new CacheLoader<[number], number>(() => {
      const res = ++count
      return res
    }, 5)
    const before = loader.get(1)
    strictEqual(loader.get(1), before)
    strictEqual(loader.get(2), before + 1)
  })
})
