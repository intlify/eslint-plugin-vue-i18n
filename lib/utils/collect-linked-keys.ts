/**
 * @fileoverview Collect the keys used by the linked messages.
 * @author Yosuke Ota
 */
import type { ResourceNode } from '@intlify/message-compiler'
import { NodeTypes } from '@intlify/message-compiler'
import { traverseNode } from './message-compiler/traverser'
import type { I18nLocaleMessageDictionary } from '../types'
import { parse } from './message-compiler/parser'
import { parse as parseForV8 } from './message-compiler/parser-v8'

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
      yield* extractUsedKeysFromAST(parse(value).ast)
      yield* extractUsedKeysFromAST(parseForV8(value).ast)
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
  return [...new Set<string>(extractUsedKeysFromLinks(object))].filter(s => !!s)
}

function extractUsedKeysFromAST(ast: ResourceNode): Set<string> {
  const keys = new Set<string>()
  traverseNode(ast, node => {
    if (node.type === NodeTypes.Linked) {
      if (node.key.type === NodeTypes.LinkedKey) {
        keys.add(node.key.value)
      } else if (node.key.type === NodeTypes.Literal) {
        keys.add(node.key.value)
      } else if (node.key.type === NodeTypes.List) {
        keys.add(String(node.key.index))
      }
    }
  })
  return keys
}
