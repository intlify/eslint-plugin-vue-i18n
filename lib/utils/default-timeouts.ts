/**
 * @fileoverview Default timeouts
 * @author Yosuke Ota
 */

export let CACHE_LOADER = 1000
export let MTIME_MS_CHECK = 300

export function setTimeouts(times: {
  CACHE_LOADER: number
  MTIME_MS_CHECK: number
}): void {
  CACHE_LOADER = times.CACHE_LOADER
  MTIME_MS_CHECK = times.MTIME_MS_CHECK
}
