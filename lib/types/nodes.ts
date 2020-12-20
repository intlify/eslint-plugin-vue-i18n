import type { MaybeNode } from './eslint'

export interface JSXText extends MaybeNode {
  type: 'JSXText'
  value: string
  raw: string
  parent: MaybeNode
}
