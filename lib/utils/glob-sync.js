/**
 * @fileoverview Subclass of `glob.GlobSync`
 * Borrow from GitHub `eslint/eslint` repo
 * @see https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob.js
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const Sync = require('glob').GlobSync
const { inherits } = require('util')

const IGNORE = Symbol('ignore')

function GlobSync(pattern, options, shouldIgnore) {
  this[IGNORE] = shouldIgnore
  Sync.call(this, pattern, options)
}
inherits(GlobSync, Sync)

GlobSync.prototype._readdir = function (abs, inGlobStar) {
  const marked = this._mark(abs)
  if (this[IGNORE](marked)) {
    return null
  }
  return Sync.prototype._readdir.call(this, abs, inGlobStar)
}

module.exports = GlobSync
