/**
 * @author Yosuke Ota
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'node:path'
import { strictEqual, deepStrictEqual, notDeepStrictEqual } from 'assert'
import { ResourceLoader } from '../../../lib/utils/resource-loader'

describe('ResourceLoader', () => {
  const testFilename = resolve(
    __dirname,
    '../../fixtures/utils/resource-loader/test.json'
  )
  it('should be refresh with change file.', async () => {
    const bk = readFileSync(testFilename, 'utf8')
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
      strictEqual(count, 1)
      await new Promise(resolve => setTimeout(resolve, 10))
      deepStrictEqual(resource.getResource(), before)
      strictEqual(count, 1)

      writeFileSync(testFilename, '"bar"', 'utf8')
      await new Promise(resolve => setTimeout(resolve, 10))
      notDeepStrictEqual(resource.getResource(), before)
      deepStrictEqual(resource.getResource(), 'bar')
      strictEqual(count, 2)
    } finally {
      writeFileSync(testFilename, bk, 'utf8')
    }
  })
})
