/**
 * @fileoverview Common helpers for operations on filenames and paths
 * Borrow from GitHub `eslint/eslint` repo
 * @see https://github.com/eslint/eslint/blob/v5.2.0/lib/util/path-util.js
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */

import { normalize, isAbsolute, resolve, relative } from 'path'

/**
 * Replace Windows with posix style paths
 */
export function convertPathToPosix(filepath: string): string {
  const normalizedFilepath = normalize(filepath)
  const posixFilepath = normalizedFilepath.replace(/\\/g, '/')

  return posixFilepath
}

/**
 * Converts an absolute filepath to a relative path from a given base path
 */
export function getRelativePath(filepath: string, baseDir: string): string {
  const absolutePath = isAbsolute(filepath) ? filepath : resolve(filepath)

  if (baseDir) {
    if (!isAbsolute(baseDir)) {
      throw new Error(`baseDir should be an absolute path: ${baseDir}`)
    }
    return relative(baseDir, absolutePath)
  }
  return absolutePath.replace(/^\//, '')
}
