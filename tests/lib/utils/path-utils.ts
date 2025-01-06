/**
 * @author Yosuke Ota
 */
import { strictEqual } from 'assert'
import { getBasename } from '../../../lib/utils/path-utils'

describe('getBasename', () => {
  it('return the filename without the extension', () => {
    strictEqual(getBasename('~/some/clever/path/to/common.json'), 'common')

    strictEqual(
      getBasename('~/some/clever/path/to/dotted.file.json'),
      'dotted.file'
    )
  })
})
