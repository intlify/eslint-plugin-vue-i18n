/**
 * @fileoverview Cache loader class
 * @author Yosuke Ota
 */
import { CACHE_LOADER } from './default-timeouts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoadData<A extends any[], R> = (...args: A) => R
/**
 * The class that returns load value or cache value.
 * This class returns the called result value of of the given loader.
 * But when the loader is called, it does not get a new value and returns a cached value until it times out.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class CacheLoader<A extends any[], R> {
  private loader: LoadData<A, R>
  private timeout: number | (() => number)
  private _cacheTime: number
  private _cacheKey: string | null = null
  private _cache: R | null = null
  constructor(
    loader: LoadData<A, R>,
    timeout: number | (() => number) = () => CACHE_LOADER
  ) {
    this.loader = loader
    this.timeout = timeout
    this._cacheTime = Number.MIN_SAFE_INTEGER
  }

  get(...args: A): R {
    const key = JSON.stringify(args)
    const now = Date.now()
    if (this._cacheKey === key) {
      const timeout =
        typeof this.timeout === 'function' ? this.timeout() : this.timeout
      if (this._cacheTime + timeout > now) {
        return this._cache!
      }
    }
    this._cacheKey = key
    this._cacheTime = now
    return (this._cache = this.loader(...args))
  }
}
