const RE_REGEXP_CHAR = /[\\^$.*+?()[\]{}|]/gu
const RE_REGEXP_STR = /^\/(.+)\/(.*)$/u

export function toRegExp(str: string): RegExp {
  const parts = RE_REGEXP_STR.exec(str)
  if (parts) {
    return new RegExp(parts[1], parts[2])
  }
  return new RegExp(`^${escape(str)}$`)
}
/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @param {string} string The string to escape.
 * @returns {string} Returns the escaped string.
 */
function escape(str: string) {
  return str && str.replace(RE_REGEXP_CHAR, '\\$&')
}
