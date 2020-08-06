import type {
  MaybeToken,
  MaybeNode,
  CursorWithSkipOptions,
  CursorWithCountOptions
} from './eslint'

export interface TokenStore {
  getTokenByRangeStart(
    offset: number,
    options?: { includeComments: boolean }
  ): MaybeToken | null
  getFirstToken(node: MaybeNode): MaybeToken
  getFirstToken(node: MaybeNode, options: number): MaybeToken
  getFirstToken(
    node: MaybeNode,
    options: CursorWithSkipOptions
  ): MaybeToken | null
  getLastToken(node: MaybeNode): MaybeToken
  getLastToken(node: MaybeNode, options: number): MaybeToken
  getLastToken(
    node: MaybeNode,
    options: CursorWithSkipOptions
  ): MaybeToken | null
  getTokenBefore(node: MaybeNode): MaybeToken
  getTokenBefore(node: MaybeNode, options: number): MaybeToken
  getTokenBefore(
    node: MaybeNode,
    options: { includeComments: boolean }
  ): MaybeToken
  getTokenBefore(
    node: MaybeNode,
    options: CursorWithSkipOptions
  ): MaybeToken | null
  getTokenAfter(node: MaybeNode): MaybeToken
  getTokenAfter(node: MaybeNode, options: number): MaybeToken
  getTokenAfter(
    node: MaybeNode,
    options: { includeComments: boolean }
  ): MaybeToken
  getTokenAfter(
    node: MaybeNode,
    options: CursorWithSkipOptions
  ): MaybeToken | null
  getFirstTokenBetween(
    left: MaybeNode,
    right: MaybeNode,
    options?: CursorWithSkipOptions
  ): MaybeToken | null
  getLastTokenBetween(
    left: MaybeNode,
    right: MaybeNode,
    options?: CursorWithSkipOptions
  ): MaybeToken | null
  getFirstTokens(
    node: MaybeNode,
    options?: CursorWithCountOptions
  ): MaybeToken[]
  getLastTokens(node: MaybeNode, options?: CursorWithCountOptions): MaybeToken[]
  getTokensBefore(
    node: MaybeNode,
    options?: CursorWithCountOptions
  ): MaybeToken[]
  getTokensAfter(
    node: MaybeNode,
    options?: CursorWithCountOptions
  ): MaybeToken[]
  getFirstTokensBetween(
    left: MaybeNode,
    right: MaybeNode,
    options?: CursorWithCountOptions
  ): MaybeToken[]
  getLastTokensBetween(
    left: MaybeNode,
    right: MaybeNode,
    options?: CursorWithCountOptions
  ): MaybeToken[]
  getTokens(
    node: MaybeNode,
    beforeCount?: CursorWithCountOptions,
    afterCount?: number
  ): MaybeToken[]
  getTokensBetween(
    left: MaybeNode,
    right: MaybeNode,
    padding?: CursorWithCountOptions
  ): MaybeToken[]
  commentsExistBetween(left: MaybeNode, right: MaybeNode): boolean
  getCommentsBefore(nodeOrToken: MaybeNode): MaybeToken[]
  getCommentsAfter(nodeOrToken: MaybeNode): MaybeToken[]
  getCommentsInside(node: MaybeNode): MaybeToken[]
}
