/**
 * A simplified version of the message parser that handles messages like vue-i18n v8.
 * This parser probably has poor performance.
 */
import type {
  CompileError,
  MessageNode,
  NamedNode,
  PluralNode,
  TextNode,
  ResourceNode,
  SourceLocation,
  ListNode,
  LinkedNode,
  LinkedModifierNode,
  LinkedKeyNode
} from '@intlify/message-compiler'
import { NodeTypes } from '@intlify/message-compiler'
import lodash from 'lodash'

export function parse(
  code: string
): {
  ast: ResourceNode
  errors: CompileError[]
} {
  const errors: CompileError[] = []
  const ast = parseAST(code, errors)
  return {
    ast,
    errors
  }
}

class CodeContext {
  public code: string
  public buff: string
  public offset: number
  private lineStartIndices: number[]
  private lines: string[]
  constructor(code: string) {
    this.code = code
    this.buff = code
    this.offset = 0
    this.lines = []
    this.lineStartIndices = [0]
    const lineEndingPattern = /\r\n|[\r\n\u2028\u2029]/gu
    let match
    while ((match = lineEndingPattern.exec(this.code))) {
      this.lines.push(
        this.code.slice(
          this.lineStartIndices[this.lineStartIndices.length - 1],
          match.index
        )
      )
      this.lineStartIndices.push(match.index + match[0].length)
    }
    this.lines.push(
      this.code.slice(this.lineStartIndices[this.lineStartIndices.length - 1])
    )
  }
  setOffset(offset: number) {
    this.offset = offset
    this.buff = this.code.slice(offset)
  }

  getLocFromIndex(index: number) {
    if (index === this.code.length) {
      return {
        line: this.lines.length,
        column: this.lines[this.lines.length - 1].length + 1
      }
    }
    const lineNumber = lodash.sortedLastIndex(this.lineStartIndices, index)
    return {
      line: lineNumber,
      column: index - this.lineStartIndices[lineNumber - 1] + 1
    }
  }

  getNodeLoc(start: number, end: number) {
    const startLoc = this.getLocFromIndex(start)
    const endLoc = this.getLocFromIndex(end)
    return {
      start,
      end,
      loc: {
        start: { ...startLoc, offset: start },
        end: { ...endLoc, offset: end }
      }
    }
  }
  setEndLoc(
    node: {
      end: number
      loc?: SourceLocation
    },
    end: number
  ) {
    const endLoc = this.getLocFromIndex(end)
    node.end = end
    node.loc!.end = { ...endLoc, offset: end }
  }
  createCompileError(message: string, offset: number) {
    const loc = this.getLocFromIndex(offset)
    const error: CompileError = new SyntaxError(
      errorMessages[message] || message
    ) as never
    error.code = errorCodes[message] || errorCodes.UNEXPECTED_LEXICAL_ANALYSIS
    error.location = {
      start: { ...loc, offset },
      end: { ...loc, offset }
    }
    error.domain = 'parser'
    return error
  }
}

const errorCodes: Record<string, number> = {
  UNTERMINATED_CLOSING_BRACE: 6,
  EMPTY_PLACEHOLDER: 7,
  UNEXPECTED_LEXICAL_ANALYSIS: 11
}

const errorMessages: Record<string, string> = {
  UNTERMINATED_CLOSING_BRACE: `Unterminated closing brace`,
  EMPTY_PLACEHOLDER: `Empty placeholder`,
  UNEXPECTED_LEXICAL_ANALYSIS: `Unexpected lexical analysis in token: '{0}'`
}

function parseAST(code: string, errors: CompileError[]): ResourceNode {
  const ctx = new CodeContext(code)
  const regexp = /\{|@[\.:]|\s*\|\s*/u
  let re
  const node: ResourceNode = {
    type: NodeTypes.Resource,
    body: undefined as never,
    ...ctx.getNodeLoc(0, code.length)
  }
  let messageNode: MessageNode = {
    type: NodeTypes.Message,
    items: [],
    ...ctx.getNodeLoc(0, code.length)
  }
  let body: MessageNode | PluralNode = messageNode
  while ((re = regexp.exec(ctx.buff))) {
    const key = re[0]
    const startOffset = ctx.offset + re.index
    const endOffset = startOffset + key.length
    if (ctx.offset < startOffset) {
      const textNode: TextNode = {
        type: NodeTypes.Text,
        value: ctx.code.slice(ctx.offset, startOffset),
        ...ctx.getNodeLoc(ctx.offset, startOffset)
      }
      messageNode.items.push(textNode)
    }
    if (key.trim() === '|') {
      ctx.setEndLoc(messageNode, startOffset)

      if (body.type === NodeTypes.Message) {
        const pluralNode: PluralNode = {
          type: NodeTypes.Plural,
          cases: [body],
          start: body.start,
          end: body.end,
          loc: {
            start: { ...body.loc!.start },
            end: { ...body.loc!.end }
          }
        }
        body = pluralNode
      }
      messageNode = {
        type: NodeTypes.Message,
        items: [],
        ...ctx.getNodeLoc(endOffset, endOffset)
      }
      body.cases.push(messageNode)
      ctx.setOffset(endOffset)
      continue
    }
    if (key === '{') {
      const endIndex = ctx.code.indexOf('}', endOffset)
      let keyValue: string
      if (endIndex > -1) {
        keyValue = ctx.code.slice(endOffset, endIndex)
      } else {
        errors.push(
          ctx.createCompileError('UNTERMINATED_CLOSING_BRACE', endOffset)
        )
        keyValue = ctx.code.slice(endOffset)
      }

      const placeholderEndOffset = endOffset + keyValue.length + 1

      let node: NamedNode | ListNode | null = null
      if (keyValue.trim()) {
        const numValue = Number(keyValue.trim())
        if (isFinite(numValue) && Number.isInteger(numValue)) {
          const listNode: ListNode = {
            type: NodeTypes.List,
            index: numValue,
            ...ctx.getNodeLoc(endOffset - 1, placeholderEndOffset)
          }
          node = listNode
        }
        if (!node) {
          const namedNode: NamedNode = {
            type: NodeTypes.Named,
            key: keyValue.trim(),
            ...ctx.getNodeLoc(endOffset - 1, placeholderEndOffset)
          }
          if (!/^[a-zA-Z][a-zA-Z0-9_$]*$/.test(namedNode.key)) {
            errors.push(
              ctx.createCompileError('Unexpected placeholder key', endOffset)
            )
          }
          node = namedNode
        }

        messageNode.items.push(node)
      } else {
        errors.push(
          ctx.createCompileError('EMPTY_PLACEHOLDER', placeholderEndOffset - 1)
        )
      }

      ctx.setOffset(placeholderEndOffset)
      continue
    }
    if (key[0] === '@') {
      ctx.setOffset(endOffset)

      messageNode.items.push(parseLiked(ctx, errors))
      continue
    }
  }
  if (ctx.buff) {
    const textNode: TextNode = {
      type: NodeTypes.Text,
      value: ctx.buff,
      ...ctx.getNodeLoc(ctx.offset, code.length)
    }
    messageNode.items.push(textNode)
  }
  ctx.setEndLoc(messageNode, code.length)
  ctx.setEndLoc(body, code.length)
  node.body = body
  return node
}

function parseLiked(ctx: CodeContext, errors: CompileError[]) {
  const linked: LinkedNode = {
    type: NodeTypes.Linked,
    key: undefined as never,
    ...ctx.getNodeLoc(ctx.offset - 2, ctx.offset)
  }
  const mark = ctx.code[ctx.offset - 1]
  if (mark === '.') {
    const modifierValue = /^[a-z]*/u.exec(ctx.buff)![0]
    const modifierEndOffset = ctx.offset + modifierValue.length
    const modifier: LinkedModifierNode = {
      type: NodeTypes.LinkedModifier,
      value: modifierValue,
      ...ctx.getNodeLoc(ctx.offset - 1, modifierEndOffset)
    }
    // empty modifier...
    if (!modifier.value) {
      errors.push(
        ctx.createCompileError(
          'Expected linked modifier value',
          modifier.loc!.start.offset
        )
      )
    }
    ctx.setOffset(modifierEndOffset)
    linked.modifier = modifier
    if (ctx.code[ctx.offset] !== ':') {
      // empty key...
      errors.push(
        ctx.createCompileError('Expected linked key value', ctx.offset)
      )
      const key: LinkedKeyNode = {
        type: NodeTypes.LinkedKey,
        value: '',
        ...ctx.getNodeLoc(ctx.offset, ctx.offset)
      }
      linked.key = key
      ctx.setEndLoc(linked, ctx.offset)
      return linked
    }
    ctx.setOffset(ctx.offset + 1)
  }
  let paren = false
  if (ctx.buff[0] === '(') {
    ctx.setOffset(ctx.offset + 1)
    paren = true
  }
  const keyValue = /^[\w\-_.]*/u.exec(ctx.buff)![0]
  const keyEndOffset = ctx.offset + keyValue.length
  const key: LinkedKeyNode = {
    type: NodeTypes.LinkedKey,
    value: keyValue,
    ...ctx.getNodeLoc(ctx.offset, keyEndOffset)
  }
  // empty key...
  if (!key.value) {
    errors.push(
      ctx.createCompileError('Expected linked key value', key.loc!.start.offset)
    )
  }
  linked.key = key
  ctx.setOffset(keyEndOffset)
  if (paren) {
    if (ctx.buff[0] === ')') {
      ctx.setOffset(ctx.offset + 1)
    } else {
      errors.push(
        ctx.createCompileError('Unterminated closing paren', ctx.offset)
      )
    }
  }

  ctx.setEndLoc(linked, ctx.offset)
  return linked
}
