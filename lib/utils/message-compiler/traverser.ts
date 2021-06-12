import type {
  LinkedKeyNode,
  LinkedModifierNode,
  LinkedNode,
  ListNode,
  LiteralNode,
  MessageNode,
  NamedNode,
  PluralNode,
  ResourceNode,
  TextNode
} from '@intlify/message-compiler'
import { NodeTypes } from './utils'

type MessageElementNode =
  | TextNode
  | NamedNode
  | ListNode
  | LiteralNode
  | LinkedNode
type MessageASTNode =
  | ResourceNode
  | PluralNode
  | MessageNode
  | MessageElementNode
  | LinkedKeyNode
  | LinkedModifierNode

function traverseNodes(
  nodes: MessageASTNode[],
  visit: (node: MessageASTNode) => void
): void {
  for (let i = 0; i < nodes.length; i++) {
    traverseNode(nodes[i], visit)
  }
}
export function traverseNode(
  node: MessageASTNode,
  visit: (node: MessageASTNode) => void
): void {
  if (!node) {
    return
  }
  visit(node)
  if (node.type === NodeTypes.Resource) {
    traverseNode(node.body, visit)
  } else if (node.type === NodeTypes.Plural) {
    traverseNodes((node as PluralNode).cases, visit)
  } else if (node.type === NodeTypes.Message) {
    traverseNodes((node as MessageNode).items, visit)
  } else if (node.type === NodeTypes.Linked) {
    const linked = node as LinkedNode
    if (linked.modifier) traverseNode(linked.modifier, visit)
    traverseNode(linked.key, visit)
  }
}
