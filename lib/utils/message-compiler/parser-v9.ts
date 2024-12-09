/**
 * A simplified version of the message parser that handles messages like vue-i18n v8.
 * This parser probably has poor performance.
 */
import type {
  CompileError,
  NamedNode,
  ResourceNode
} from '@intlify/message-compiler'
import { NodeTypes } from './utils'
import { parse as baseParse } from './parser'
import type { MessageElementNode } from './traverser'
import { traverseNode } from './traverser'

// The deprecated Rails i18n format.
export type ModuloNamedNode = NamedNode & { modulo?: boolean }

export function parse(code: string): {
  ast: ResourceNode
  errors: CompileError[]
} {
  const { ast, errors } = baseParse(code)

  traverseNode(ast, node => {
    if (node.type === NodeTypes.Message) {
      transformModuloNamedNode(node.items)
    }
  })
  return {
    ast,
    errors
  }

  function transformModuloNamedNode(nodes: MessageElementNode[]) {
    // Converts nodes with a '%' before the brackets into modulo nodes.
    for (let index = nodes.length - 1; index >= 1; index--) {
      const node = nodes[index]
      if (
        node.type !== NodeTypes.Named ||
        code[node.loc!.start.offset - 1] !== '%'
      )
        continue

      const prev = nodes[index - 1]
      if (prev.type !== NodeTypes.Text || !prev.value?.endsWith('%')) continue

      node.modulo = true

      prev.loc!.end.offset -= 1
      prev.loc!.end.column -= 1
      prev.end! -= 1
      prev.value = prev.value!.slice(0, -1)
      if (prev.start === prev.end) {
        nodes.splice(index - 1, 1)
        index--
      }
    }
  }
}
