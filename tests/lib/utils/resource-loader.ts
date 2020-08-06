/**
 * @author Yosuke Ota
 */
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { ResourceLoader } from '../../../lib/utils/resource-loader'

describe('ResourceLoader', () => {
  const testFilename = path.resolve(
    __dirname,
    '../../fixtures/utils/resource-loader/test.json'
  )
  it('should be refresh with change file.', async () => {
    const bk = fs.readFileSync(testFilename, 'utf8')
    try {
      let count = 0
      const resource = new ResourceLoader(
        testFilename,
        p => {
          count++
          const key = require.resolve(p)
          delete require.cache[key]
          return require(p)
        },
        5
      )
      const before = resource.getResource()
      assert.strictEqual(count, 1)
      await new Promise(resolve => setTimeout(resolve, 10))
      assert.deepStrictEqual(resource.getResource(), before)
      assert.strictEqual(count, 1)

      fs.writeFileSync(testFilename, '"bar"', 'utf8')
      await new Promise(resolve => setTimeout(resolve, 10))
      assert.notDeepStrictEqual(resource.getResource(), before)
      assert.deepStrictEqual(resource.getResource(), 'bar')
      assert.strictEqual(count, 2)
    } finally {
      fs.writeFileSync(testFilename, bk, 'utf8')
    }
  })
})
