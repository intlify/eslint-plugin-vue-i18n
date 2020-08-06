/**
 * @fileoverview parser for <i18n> block
 * @author Yosuke Ota
 */

const {
  parseForESLint: parseJsonForESLint,
  getStaticJSONValue
} = require('eslint-plugin-jsonc')
const {
  parseForESLint: parseYamlForESLint,
  getStaticYAMLValue
} = require('yaml-eslint-parser')
const { SourceCode } = require('eslint')
const { AST } = require('vue-eslint-parser')
const { LocationFixer } = require('./location-fixer')

/**
 * @typedef {import('vue-eslint-parser').AST.VElement} VElement
 */

/**
 * @param {RuleContext} context
 * @param {VElement} i18nBlock
 */
function parseInI18nBlock(context, i18nBlock, parseForESLint) {
  if (!i18nBlock.endTag) {
    return null
  }
  const offsetIndex = i18nBlock.startTag.range[1]
  const tokenStore = context.parserServices.getTemplateBodyTokenStore()
  const tokens = tokenStore.getTokensBetween(
    i18nBlock.startTag,
    i18nBlock.endTag
  )
  const sourceString = tokens.map(t => t.value).join('')
  if (!sourceString.trim()) {
    return null
  }
  const sourceCode = context.getSourceCode()
  const locationFixer = new LocationFixer(
    sourceCode,
    offsetIndex,
    sourceCode.text.slice(offsetIndex, i18nBlock.endTag.range[0]),
    sourceString
  )

  let ast, visitorKeys
  try {
    ;({ ast, visitorKeys } = parseForESLint(sourceString, {
      ecmaVersion: 2019,
      loc: true,
      range: true,
      raw: true,
      tokens: true,
      comment: true,
      eslintVisitorKeys: true,
      eslintScopeManager: true
    }))
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
  AST.traverseNodes(ast, {
    visitorKeys,
    enterNode(node, parent) {
      node.parent = parent || null

      locationFixer.fixLocations(node)
    },
    leaveNode() {}
  })
  for (const token of ast.tokens || []) {
    locationFixer.fixLocations(token)
  }
  for (const comment of ast.comments || []) {
    locationFixer.fixLocations(comment)
  }

  let resourceSourceCode
  return {
    ast,
    sourceString,
    getSourceCode() {
      return (
        resourceSourceCode ||
        (resourceSourceCode = new SourceCode(sourceCode.text, ast))
      )
    },
    traverseNodes(node, visitor) {
      AST.traverseNodes(node, {
        visitorKeys,
        ...visitor
      })
    }
  }
}

module.exports = {
  /**
   * @param {RuleContext} context
   * @param {VElement} i18nBlock
   */
  parseJsonInI18nBlock(context, i18nBlock) {
    const result = parseInI18nBlock(context, i18nBlock, parseJsonForESLint)
    if (result == null) {
      return result
    }
    return {
      lang: 'json',
      getStaticValue: getStaticJSONValue,
      ...result
    }
  },
  /**
   * @param {RuleContext} context
   * @param {VElement} i18nBlock
   */
  parseYamlInI18nBlock(context, i18nBlock) {
    const result = parseInI18nBlock(context, i18nBlock, parseYamlForESLint)
    if (result == null) {
      return result
    }
    return {
      lang: 'yaml',
      getStaticValue: getStaticYAMLValue,
      ...result
    }
  }
}
