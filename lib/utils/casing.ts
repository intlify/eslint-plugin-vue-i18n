/**
 * @fileoverview Casing helpers
 * @author Yosuke Ota
 */

/**
 * Checks whether the given string has symbols.
 */
function hasSymbols(str: string) {
  return /[!"#%&'()*+,./:;<=>?@[\\\]^`{|}]/u.exec(str) // without " ", "$", "-" and "_"
}
/**
 * Checks whether the given string has upper.
 */
function hasUpper(str: string) {
  return /[A-Z]/u.exec(str)
}

/**
 * Checks whether the given string is kebab-case.
 */
export function isKebabCase(str: string): boolean {
  if (
    hasUpper(str) ||
    hasSymbols(str) ||
    /^\d/u.exec(str) ||
    /^-/u.exec(str) || // starts with hyphen is not kebab-case
    /_|--|\s/u.exec(str)
  ) {
    return false
  }
  return true
}
/**
 * Checks whether the given string is snake_case.
 */
export function isSnakeCase(str: string): boolean {
  if (
    hasUpper(str) ||
    hasSymbols(str) ||
    /^\d/u.exec(str) ||
    /-|__|\s/u.exec(str)
  ) {
    return false
  }
  return true
}

/**
 * Checks whether the given string is camelCase.
 */
export function isCamelCase(str: string): boolean {
  if (
    hasSymbols(str) ||
    /^[A-Z\d]/u.exec(str) ||
    /-|_|\s/u.exec(str) // kebab or snake or space
  ) {
    return false
  }
  return true
}

/**
 * Checks whether the given string is PascalCase.
 */
export function isPascalCase(str: string): boolean {
  if (
    hasSymbols(str) ||
    /^[a-z\d]/u.exec(str) ||
    /-|_|\s/u.exec(str) // kebab or snake or space
  ) {
    return false
  }
  return true
}

const checkersMap = {
  'kebab-case': isKebabCase,
  snake_case: isSnakeCase,
  camelCase: isCamelCase,
  PascalCase: isPascalCase
}

export const allowedCaseOptions = [
  'camelCase',
  'kebab-case',
  'PascalCase',
  'snake_case'
] as const

/**
 * Return case checker
 */
export function getCasingChecker(
  name: typeof allowedCaseOptions[number]
): (str: string) => boolean {
  return checkersMap[name] || isPascalCase
}
