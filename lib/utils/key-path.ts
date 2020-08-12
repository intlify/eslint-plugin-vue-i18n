/**
 * @fileoverview Utility for localization keys
 * @author Yosuke Ota
 */
export function joinPath(base: string, ...paths: (string | number)[]): string {
  let result = base
  for (const p of paths) {
    if (typeof p === 'number') {
      result += `[${p}]`
    } else if (/^[^\s,.[\]]+$/iu.test(p)) {
      result = result ? `${result}.${p}` : p
    } else if (/^(?:0|[1-9]\d*)*$/iu.test(p)) {
      result += `[${p}]`
    } else {
      result += `[${JSON.stringify(p)}]`
    }
  }
  return result
}
