/**
 * @fileoverview Resource loader class
 * @author Yosuke Ota
 */

const fs = require('fs')
const CacheLoader = require('./cache-loader')

/**
 * The class of resource loader.
 * This class gets and returns the resource for the given file.
 * But when the loader is called, the loader will not check for new values until 300ms has elapsed.
 * Also, if the result of the check is that the mtime of the file has not changed, the new value is not load and the cached value is returned.
 */
module.exports = class ResourceLoader {
  constructor (filename, loader, mtimeCheckTimeout = () => require('./default-timeouts').MTIME_MS_CHECK) {
    this.filename = filename
    this.loader = loader
    this._resource = null
    this._mtimeLoader = new CacheLoader(() => {
      try {
        const stat = fs.statSync(this.filename)
        return stat.mtimeMs
      } catch (_e) {
        // ignore
      }
      return this._mtimeMs || 0
    }, mtimeCheckTimeout)
  }

  getResource () {
    const mtimeMs = this._mtimeLoader.get()
    if (this._resource && this._mtimeMs >= mtimeMs) {
      return this._resource
    }
    this._mtimeMs = mtimeMs
    return (this._resource = this.loader(this.filename))
  }
}
