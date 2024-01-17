import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { AST as VAST } from 'vue-eslint-parser'
import type { JSONSchema4 } from 'json-schema'
import type { VueParserServices } from './vue-parser-services'
import type { TokenStore } from './types'
import type { SettingsVueI18nLocaleDir } from './settings'
import type { RuleListener } from './vue-parser-services'

export interface Position {
  /** >= 1 */
  line: number
  /** >= 0 */
  column: number
}
export type Range = [number, number]
export interface SourceLocation {
  start: Position
  end: Position
}
export interface MaybeNode {
  type: string
  range: Range
  loc: SourceLocation
}
export interface MaybeToken extends MaybeNode {
  value: string
}

export interface RuleContext {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any[]
  settings: {
    'vue-i18n'?: {
      localeDir?: SettingsVueI18nLocaleDir
      messageSyntaxVersion?: string
      cwd?: string // for test
    }
  }
  parserPath: string

  report(descriptor: ReportDescriptor): void
  getCwd?: () => string
}

interface ReportDescriptorOptionsBase {
  data?: { [key: string]: string }

  fix?:
    | null
    | ((fixer: RuleFixer) => null | Fix | IterableIterator<Fix> | Fix[])
}

type SuggestionDescriptorMessage = { desc: string } | { messageId: string }
export type SuggestionReportDescriptor = SuggestionDescriptorMessage &
  ReportDescriptorOptionsBase

interface ReportDescriptorOptions extends ReportDescriptorOptionsBase {
  suggest?: SuggestionReportDescriptor[] | null
}

type ReportDescriptor = ReportDescriptorMessage &
  ReportDescriptorLocation &
  ReportDescriptorOptions
type ReportDescriptorMessage = { message: string } | { messageId: string }
type ReportDescriptorLocation =
  | { node: MaybeNode }
  | { loc: SourceLocation | { line: number; column: number } }

export interface RuleFixer {
  insertTextAfter(nodeOrToken: MaybeNode, text: string): Fix

  insertTextAfterRange(range: Range, text: string): Fix

  insertTextBefore(nodeOrToken: MaybeNode, text: string): Fix

  insertTextBeforeRange(range: Range, text: string): Fix

  remove(nodeOrToken: MaybeNode): Fix

  removeRange(range: Range): Fix

  replaceText(nodeOrToken: MaybeNode, text: string): Fix

  replaceTextRange(range: Range, text: string): Fix
}

export interface Fix {
  range: Range
  text: string
}

export type FilterPredicate = (tokenOrComment: MaybeToken) => boolean

export type CursorWithSkipOptions =
  | number
  | FilterPredicate
  | {
      includeComments?: boolean
      filter?: FilterPredicate
      skip?: number
    }

export type CursorWithCountOptions =
  | number
  | FilterPredicate
  | {
      includeComments?: boolean
      filter?: FilterPredicate
      count?: number
    }

export interface SourceCode extends TokenStore {
  text: string
  ast: VAST.ESLintProgram | JSONAST.JSONProgram | YAMLAST.YAMLProgram
  lines: string[]
  hasBOM: boolean
  scopeManager: ScopeManager
  visitorKeys: VisitorKeys
  parserServices: {
    isYAML?: true
    isJSON?: true
  } & VueParserServices

  getScope(node: MaybeNode): Scope

  getText(node?: MaybeNode, beforeCount?: number, afterCount?: number): string
  getLines(): string[]
  getAllComments(): MaybeToken[]
  getComments(node: MaybeNode): {
    leading: MaybeToken[]
    trailing: MaybeToken[]
  }
  getJSDocComment(node: MaybeNode): MaybeToken | null
  getNodeByRangeIndex(index: number): MaybeNode
  isSpaceBetweenTokens(first: MaybeToken, second: MaybeToken): boolean
  getLocFromIndex(index: number): Position
  getIndexFromLoc(location: Position): number
}

export interface ScopeManager {
  scopes: Scope[]
  globalScope: Scope | null
  acquire(
    node: VAST.ESLintNode | VAST.ESLintProgram,
    inner?: boolean
  ): Scope | null
  getDeclaredVariables(node: VAST.ESLintNode): Variable[]
}
export interface Scope {
  type:
    | 'block'
    | 'catch'
    | 'class'
    | 'for'
    | 'function'
    | 'function-expression-name'
    | 'global'
    | 'module'
    | 'switch'
    | 'with'
    | 'TDZ'
  isStrict: boolean
  upper: Scope | null
  childScopes: Scope[]
  variableScope: Scope
  block: VAST.ESLintNode
  variables: Variable[]
  set: Map<string, Variable>
  references: Reference[]
  through: Reference[]
  functionExpressionScope: boolean
}
export interface Variable {
  name: string
  identifiers: VAST.ESLintIdentifier[]
  references: Reference[]
  defs: Definition[]
}
export interface Reference {
  identifier: VAST.ESLintIdentifier
  from: Scope
  resolved: Variable | null
  writeExpr: VAST.ESLintNode | null
  init: boolean
  isWrite(): boolean
  isRead(): boolean
  isWriteOnly(): boolean
  isReadOnly(): boolean
  isReadWrite(): boolean
}
export type DefinitionType =
  | { type: 'CatchClause'; node: VAST.ESLintCatchClause; parent: null }
  | {
      type: 'ClassName'
      node: VAST.ESLintClassDeclaration | VAST.ESLintClassExpression
      parent: null
    }
  | {
      type: 'FunctionName'
      node: VAST.ESLintFunctionDeclaration | VAST.ESLintFunctionExpression
      parent: null
    }
  | { type: 'ImplicitGlobalVariable'; node: VAST.ESLintProgram; parent: null }
  | {
      type: 'ImportBinding'
      node:
        | VAST.ESLintImportSpecifier
        | VAST.ESLintImportDefaultSpecifier
        | VAST.ESLintImportNamespaceSpecifier
      parent: VAST.ESLintImportDeclaration
    }
  | {
      type: 'Parameter'
      node:
        | VAST.ESLintFunctionDeclaration
        | VAST.ESLintFunctionExpression
        | VAST.ESLintArrowFunctionExpression
      parent: null
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'TDZ'; node: any; parent: null }
  | {
      type: 'Variable'
      node: VAST.ESLintVariableDeclarator
      parent: VAST.ESLintVariableDeclaration
    }
export type Definition = DefinitionType & { name: VAST.ESLintIdentifier }

export interface VisitorKeys {
  [type: string]: string[]
}

export type RuleModule = {
  create(context: RuleContext): RuleListener
  meta: RuleMetaData
}

export interface RuleMetaData {
  docs: {
    description: string
    category: 'Recommended' | 'Best Practices' | 'Stylistic Issues'
    recommended?: boolean
    replacedBy?: string[]
    url: string
  }
  messages?: { [messageId: string]: string }
  fixable: 'code' | 'whitespace' | null
  schema: JSONSchema4[]
  hasSuggestions?: true
  deprecated?: boolean
  type: 'problem' | 'suggestion' | 'layout'
}
