/**
 * @fileoverview Common helpers for operations on filenames and paths
 * Borrow from GitHub `eslint/eslint` repo
 * @see https://github.com/eslint/eslint/blob/master/lib/util/path-utils.js
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { normalize, isAbsolute, resolve, relative } = require('path')

/**
 * Replace Windows with posix style paths
 */
function convertPathToPosix (filepath) {
  const normalizedFilepath = normalize(filepath)
  const posixFilepath = normalizedFilepath.replace(/\\/g, '/')

  return posixFilepath
}

/**
 * Converts an absolute filepath to a relative path from a given base path
 */
function getRelativePath (filepath, baseDir) {
  const absolutePath = isAbsolute(filepath)
    ? filepath
    : resolve(filepath)

  if (baseDir) {
    if (!isAbsolute(baseDir)) {
      throw new Error(`baseDir should be an absolute path: ${baseDir}`)
    }
    return relative(baseDir, absolutePath)
  }
  return absolutePath.replace(/^\//, '')
}

module.exports = {
  convertPathToPosix,
  getRelativePath
}
