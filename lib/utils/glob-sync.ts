/**
 * @fileoverview Subclass of `glob.GlobSync`
 * Borrow from GitHub `eslint/eslint` repo
 * @see https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob.js
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */

import { GlobSync as Sync, IOptions, IGlobBase } from 'glob'
import { inherits } from 'util'

const IGNORE = Symbol('ignore')

/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function GlobSync(
  pattern: string,
  options: IOptions,
  shouldIgnore: (absolutePath: string) => boolean
) {
  // @ts-ignore
  this[IGNORE] = shouldIgnore
  // @ts-ignore
  Sync.call(this, pattern, options)
}
inherits(GlobSync, Sync)

// @ts-ignore
GlobSync.prototype._readdir = function (abs, inGlobStar) {
  const marked = this._mark(abs)
  if (this[IGNORE](marked)) {
    return null
  }
  // @ts-ignore
  return Sync.prototype._readdir.call(this, abs, inGlobStar)
}

export default (GlobSync as never) as new (
  pattern: string,
  options: IOptions,
  shouldIgnore: (absolutePath: string) => boolean
) => IGlobBase
