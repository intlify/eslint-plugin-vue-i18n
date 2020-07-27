/**
 * @fileoverview Cache loader class
 * @author Yosuke Ota
 */

/**
 * The class that returns load value or cache value.
 * This class returns the called result value of of the given loader.
 * But when the loader is called, it does not get a new value and returns a cached value until it times out.
 */
module.exports = class CacheLoader {
  constructor (loader, timeout = () => require('./default-timeouts').CACHE_LOADER) {
    this.loader = loader
    this.timeout = timeout
    this._cacheTime = Number.MIN_SAFE_INTEGER
  }

  get (...args) {
    const key = JSON.stringify(args)
    const now = Date.now()
    if (this._cacheKey === key) {
      const timeout = typeof this.timeout === 'function' ? this.timeout() : this.timeout
      if (this._cacheTime + timeout > now) {
        return this._cache
      }
    }
    this._cacheKey = key
    this._cacheTime = now
    return (this._cache = this.loader(...args))
  }
}

