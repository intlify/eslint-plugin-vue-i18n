/**
 * @fileoverview Cache function
 * @author Yosuke Ota
 */

import type { LoadData } from './cache-loader'
import { CacheLoader } from './cache-loader'

/**
 * This function returns a function that returns the result value that was called for the given function.
 * But when called, it returns the cached value if it is the same as the previous argument.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineCacheFunction<A extends any[], R>(
  fn: LoadData<A, R>
): (...args: A) => R {
  const loader = new CacheLoader(fn, Infinity)
  return (...args: A) => {
    return loader.get(...args)
  }
}
