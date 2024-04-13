import type { Rule } from 'eslint'
import type { RuleContext, SourceCode } from './eslint'
import type { AST as VAST } from 'vue-eslint-parser'
import type { TokenStore } from './types'
import type { VElement } from 'vue-eslint-parser/ast'

export interface TemplateListener {
  [key: string]: ((node: never) => void) | undefined
}
export interface RuleListener {
  onCodePathStart?(codePath: Rule.CodePath, node: never): void
  onCodePathEnd?(codePath: Rule.CodePath, node: never): void
  onCodePathSegmentStart?(segment: Rule.CodePathSegment, node: never): void
  onCodePathSegmentEnd?(segment: Rule.CodePathSegment, node: never): void
  onCodePathSegmentLoop?(
    fromSegment: Rule.CodePathSegment,
    toSegment: Rule.CodePathSegment,
    node: never
  ): void
  [key: string]:
    | ((node: never) => void)
    | ((codePath: Rule.CodePath, node: never) => void)
    | ((segment: Rule.CodePathSegment, node: never) => void)
    | ((
        fromSegment: Rule.CodePathSegment,
        toSegment: Rule.CodePathSegment,
        node: never
      ) => void)
    | undefined
}

export interface VueParserServices {
  getTemplateBodyTokenStore: () => TokenStore
  defineTemplateBodyVisitor?: (
    templateBodyVisitor: TemplateListener,
    scriptVisitor?: RuleListener
  ) => RuleListener
  defineCustomBlocksVisitor?: (
    context: RuleContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: { parseForESLint: (code: string, options: any) => any },
    rule: {
      target:
        | string
        | string[]
        | ((lang: string | null, customBlock: VAST.VElement) => boolean)
      create: CustomBlockVisitorFactory
    },
    scriptVisitor?: RuleListener
  ) => RuleListener
  getDocumentFragment?: () => VAST.VDocumentFragment | null
}

export type CustomBlockVisitorFactory = (
  context: RuleContext & {
    parserServices: SourceCode['parserServices'] & { customBlock: VElement }
  }
) => RuleListener
