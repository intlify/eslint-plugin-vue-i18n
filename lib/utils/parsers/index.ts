/**
 * @fileoverview parser for <i18n> block
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'eslint-plugin-jsonc'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import {
  parseForESLint as parseJsonForESLint,
  getStaticJSONValue
} from 'eslint-plugin-jsonc'
import {
  parseForESLint as parseYamlForESLint,
  getStaticYAMLValue
} from 'yaml-eslint-parser'
import { SourceCode } from 'eslint'
import { AST as VAST } from 'vue-eslint-parser'
import { LocationFixer } from './location-fixer'
import type {
  RuleContext,
  MaybeNode,
  I18nLocaleMessageDictionary,
  SourceCode as VSourceCode,
  VisitorKeys
} from '../../types'

export type Visitor = {
  enterNode(
    node: JSONAST.JSONNode | YAMLAST.YAMLNode,
    parent: JSONAST.JSONNode | YAMLAST.YAMLNode
  ): void
  leaveNode(
    node: JSONAST.JSONNode | YAMLAST.YAMLNode,
    parent: JSONAST.JSONNode | YAMLAST.YAMLNode
  ): void
}

export interface Parsed<N> {
  lang: 'json' | 'yaml'
  ast: N & { type: 'Program' }
  getStaticValue(node?: N): I18nLocaleMessageDictionary
  traverseNodes(
    node: JSONAST.JSONNode | YAMLAST.YAMLNode,
    visitor: Visitor
  ): void
  sourceString: string
  getSourceCode(): VSourceCode
}

export interface JSONParsed extends Parsed<JSONAST.JSONNode> {
  lang: 'json'
  ast: JSONAST.JSONProgram
}

export interface YAMLParsed extends Parsed<YAMLAST.YAMLNode> {
  lang: 'yaml'
  ast: YAMLAST.YAMLProgram
}

function hasEndTag(
  element: VAST.VElement
): element is VAST.VElement & { endTag: VAST.VEndTag } {
  return !!element.endTag
}

function getSourceCodeString(
  context: RuleContext,
  i18nBlock: VAST.VElement & { endTag: VAST.VEndTag }
): string {
  const tokenStore = context.parserServices.getTemplateBodyTokenStore()
  const tokens = tokenStore.getTokensBetween(
    i18nBlock.startTag,
    i18nBlock.endTag
  )
  if (
    tokens.length ||
    i18nBlock.startTag.range[1] === i18nBlock.endTag.range[0]
  ) {
    return tokens.map(t => t.value).join('')
  }
  // without <template></template>
  const df = context.parserServices.getDocumentFragment?.()
  if (!df) {
    return ''
  }
  const start = i18nBlock.startTag.range[1]
  const end = i18nBlock.endTag.range[0]
  let sourceCode = ''
  for (const token of df.tokens) {
    if (start <= token.range[0] && token.range[1] <= end) {
      sourceCode += token.value
    }
    if (end <= token.range[0]) {
      break
    }
  }
  return sourceCode
}

/**
 * @param {RuleContext} context
 * @param {VElement} i18nBlock
 */
function parseInI18nBlock<P extends JSONAST.JSONProgram | YAMLAST.YAMLProgram>(
  context: RuleContext,
  i18nBlock: VAST.VElement,
  parseForESLint: (
    code: string,
    option: unknown
  ) => { ast: P; visitorKeys: VisitorKeys }
) {
  if (!hasEndTag(i18nBlock)) {
    return null
  }
  const sourceString = getSourceCodeString(context, i18nBlock)
  if (!sourceString.trim()) {
    return null
  }
  const offsetIndex = i18nBlock.startTag.range[1]
  const sourceCode = context.getSourceCode()
  const locationFixer = new LocationFixer(
    sourceCode,
    offsetIndex,
    sourceCode.text.slice(offsetIndex, i18nBlock.endTag.range[0]),
    sourceString
  )

  let ast: P, visitorKeys: VisitorKeys
  try {
    const result = parseForESLint(sourceString, {
      ecmaVersion: 2019,
      loc: true,
      range: true,
      raw: true,
      tokens: true,
      comment: true,
      eslintVisitorKeys: true,
      eslintScopeManager: true
    })
    ast = result.ast
    visitorKeys = result.visitorKeys!
  } catch (e) {
    const { line, column } = locationFixer.getFixLoc(
      e.lineNumber,
      e.column,
      e.index
    )
    context.report({
      message: e.message,
      loc: { line, column }
    })
    return null
  }

  // fix locations
  VAST.traverseNodes(ast as never, {
    visitorKeys,
    enterNode(node, parent) {
      node.parent = parent || null

      locationFixer.fixLocations(node)
    },
    leaveNode() {
      // noop
    }
  })
  for (const token of ast.tokens || []) {
    locationFixer.fixLocations(token)
  }
  for (const comment of ast.comments || []) {
    locationFixer.fixLocations(comment as MaybeNode)
  }

  let resourceSourceCode: VSourceCode
  return {
    ast,
    sourceString,
    getSourceCode(): VSourceCode {
      return (
        resourceSourceCode ||
        (resourceSourceCode = new SourceCode(
          sourceCode.text,
          ast as never
        ) as VSourceCode)
      )
    },
    traverseNodes(node: JSONAST.JSONNode | YAMLAST.YAMLNode, visitor: Visitor) {
      VAST.traverseNodes(
        node as never,
        {
          visitorKeys,
          ...visitor
        } as never
      )
    }
  }
}

/**
 * @param {RuleContext} context
 * @param {VElement} i18nBlock
 */
export function parseJsonInI18nBlock(
  context: RuleContext,
  i18nBlock: VAST.VElement
): JSONParsed | null {
  const result = parseInI18nBlock(
    context,
    i18nBlock,
    (parseJsonForESLint as never) as (
      code: string,
      option: unknown
    ) => { ast: JSONAST.JSONProgram; visitorKeys: VisitorKeys }
  )
  if (result == null) {
    return result
  }
  return {
    lang: 'json',
    getStaticValue(node: JSONAST.JSONNode): I18nLocaleMessageDictionary {
      return getStaticJSONValue(node as never) as never
    },
    ...result
  }
}
/**
 * @param {RuleContext} context
 * @param {VElement} i18nBlock
 */
export function parseYamlInI18nBlock(
  context: RuleContext,
  i18nBlock: VAST.VElement
): YAMLParsed | null {
  const result = parseInI18nBlock(context, i18nBlock, parseYamlForESLint)
  if (result == null) {
    return result
  }
  return {
    lang: 'yaml',
    getStaticValue(node: YAMLAST.YAMLNode): I18nLocaleMessageDictionary {
      return getStaticYAMLValue(node as never) as never
    },
    ...result
  }
}
