/**
 * @author Yosuke Ota
 */
import assert from 'assert'
import { getBasename } from '../../../lib/utils/path-utils'

describe('getBasename', () => {
  it('return the filename without the extension', () => {
    assert.strictEqual(
      getBasename('~/some/clever/path/to/common.json'),
      'common'
    )

    assert.strictEqual(
      getBasename('~/some/clever/path/to/dotted.file.json'),
      'dotted.file'
    )
  })
})
