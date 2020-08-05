/**
 * @fileoverview Cache function
 * @author Yosuke Ota
 */

const CacheLoader = require('./cache-loader')

/**
 * This function returns a function that returns the result value that was called for the given function.
 * But when called, it returns the cached value if it is the same as the previous argument.
 */
module.exports = function defineCacheFunction (fn) {
  const loader = new CacheLoader(fn, Infinity)
  return (...args) => {
    return loader.get(...args)
  }
}

