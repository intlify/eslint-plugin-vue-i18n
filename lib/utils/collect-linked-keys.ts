/**
 * @fileoverview Collect the keys used by the linked messages.
 * @author Yosuke Ota
 */
// Note: If vue-i18n@next parser is separated from vue plugin, change it to use that.

import type { I18nLocaleMessageDictionary } from '../types'

const linkKeyMatcher = /(?:@(?:\.[a-z]+)?:(?:[\w\-_|.]+|\([\w\-_|.]+\)))/g
const linkKeyPrefixMatcher = /^@(?:\.([a-z]+))?:/
const bracketsMatcher = /[()]/g

/**
 * Extract the keys used by the linked messages.
 * @param {any} object
 * @returns {IterableIterator<string>}
 */
function* extractUsedKeysFromLinks(
  object: I18nLocaleMessageDictionary
): IterableIterator<string> {
  for (const value of Object.values(object)) {
    if (!value) {
      continue
    }
    if (typeof value === 'object') {
      yield* extractUsedKeysFromLinks(value)
    } else if (typeof value === 'string') {
      if (value.indexOf('@:') >= 0 || value.indexOf('@.') >= 0) {
        // see https://github.com/kazupon/vue-i18n/blob/c07d1914dcac186291b658a8b9627732010f6848/src/index.js#L435
        const matches = value.match(linkKeyMatcher)!
        for (const idx in matches) {
          const link = matches[idx]
          const linkKeyPrefixMatches = link.match(linkKeyPrefixMatcher)!
          const [linkPrefix] = linkKeyPrefixMatches

          // Remove the leading @:, @.case: and the brackets
          const linkPlaceholder = link
            .replace(linkPrefix, '')
            .replace(bracketsMatcher, '')
          yield linkPlaceholder
        }
      }
    }
  }
}

/**
 * Collect the keys used by the linked messages.
 * @param {any} object
 * @returns {string[]}
 */
export function collectLinkedKeys(
  object: I18nLocaleMessageDictionary
): string[] {
  return [...new Set<string>(extractUsedKeysFromLinks(object))]
}
