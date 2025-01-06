/**
 * @fileoverview parser for <i18n> block
 * @author Yosuke Ota
 */
import { parse } from 'json5'
import { load } from 'js-yaml'
import type { AST as VAST } from 'vue-eslint-parser'
import type { I18nLocaleMessageDictionary } from '../../types'

function hasEndTag(
  element: VAST.VElement
): element is VAST.VElement & { endTag: VAST.VEndTag } {
  return !!element.endTag
}

/**
 * @param {RuleContext} context
 * @param {VElement} i18nBlock
 */
function parseValuesInI18nBlock(
  i18nBlock: VAST.VElement,
  parse: (code: string) => I18nLocaleMessageDictionary
) {
  if (!hasEndTag(i18nBlock)) {
    return null
  }
  const text = i18nBlock.children[0]
  const sourceString = text != null && text.type === 'VText' ? text.value : ''
  if (!sourceString.trim()) {
    return null
  }
  try {
    return parse(sourceString)
  } catch (e) {
    return null
  }
}

/**
 * @param {VElement} i18nBlock
 */
export function parseJsonValuesInI18nBlock(
  i18nBlock: VAST.VElement
): I18nLocaleMessageDictionary | null {
  return parseValuesInI18nBlock(i18nBlock, code => parse(code))
}

/**
 * @param {VElement} i18nBlock
 */
export function parseYamlValuesInI18nBlock(
  i18nBlock: VAST.VElement
): I18nLocaleMessageDictionary | null {
  return parseValuesInI18nBlock(i18nBlock, code => load(code) as never)
}
