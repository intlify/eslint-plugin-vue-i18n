/**
 * @fileoverview Casing helpers
 * @author Yosuke Ota
 */

/**
 * Capitalize a string.
 */
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

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
 * Checks whether the given string has lower.
 * @param {string} str
 */
function hasLower(str: string) {
  return /[a-z]/u.test(str)
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
 * Checks whether the given string is lowercase.
 */
export function isLowerCase(str: string): boolean {
  if (
    hasSymbols(str) ||
    hasUpper(str) ||
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

/**
 * Checks whether the given string is SCREAMING_SNAKE_CASE.
 * @param {string} str
 */
export function isScreamingSnakeCase(str: string): boolean {
  if (hasLower(str) || hasSymbols(str) || /-|__|\s/u.test(str)) {
    return false
  }
  return true
}

const checkersMap = {
  'kebab-case': isKebabCase,
  snake_case: isSnakeCase,
  camelCase: isCamelCase,
  lowercase: isLowerCase,
  PascalCase: isPascalCase,
  SCREAMING_SNAKE_CASE: isScreamingSnakeCase
}

/**
 * Convert text to camelCase
 */
export function camelCase(str: string): string {
  if (isPascalCase(str)) {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }
  return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ''))
}
/**
 * Convert text to PascalCase
 */
export function pascalCase(str: string): string {
  return capitalize(camelCase(str))
}

export const allowedCaseOptions = [
  'camelCase',
  'kebab-case',
  'lowercase',
  'PascalCase',
  'snake_case',
  'SCREAMING_SNAKE_CASE'
] as const

/**
 * Return case checker
 */
export function getCasingChecker(
  name: (typeof allowedCaseOptions)[number]
): (str: string) => boolean {
  return checkersMap[name] || isPascalCase
}
