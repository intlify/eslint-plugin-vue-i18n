/**
 * @fileoverview JSON parser for <i18n> block
 * @author Yosuke Ota
 */
'use strict'

const diff = require('fast-diff')
const { parseJSON, traverseNodes: traverseJsonNodes } = require('eslint-plugin-jsonc')
const { SourceCode } = require('eslint')

/**
 * @typedef {import('vue-eslint-parser').AST.VElement} VElement
 */

/**
 * @param {RuleContext} context
 * @param {VElement} i18nBlock
 */
function parseJsonInI18nBlock (context, i18nBlock) {
  if (!i18nBlock.endTag) {
    return null
  }
  const offsetIndex = i18nBlock.startTag.range[1]
  const tokenStore = context.parserServices.getTemplateBodyTokenStore()
  const tokens = tokenStore.getTokensBetween(i18nBlock.startTag, i18nBlock.endTag)
  const jsonString = tokens.map(t => t.value).join('')
  if (!jsonString.trim()) {
    return null
  }
  const sourceCode = context.getSourceCode()
  const locatonFixer = new LocatonFixer(
    sourceCode,
    offsetIndex,
    sourceCode.text.slice(offsetIndex, i18nBlock.endTag.range[0]),
    jsonString
  )

  let ast
  try {
    ast = parseJSON(jsonString)
  } catch (e) {
    const { line, column } = locatonFixer.getFixLoc(e.lineNumber, e.column, e.index)
    context.report({
      message: e.message,
      loc: { line, column }
    })
    return null
  }

  // fix locations
  traverseJsonNodes(ast, {
    enterNode (node, parent) {
      node.parent = parent || null

      locatonFixer.fixLocations(node)
    },
    leaveNode () {}
  })

  for (const token of ast.tokens || []) {
    locatonFixer.fixLocations(token)
  }
  for (const comment of ast.comments || []) {
    locatonFixer.fixLocations(comment)
  }

  let jsonSourceCode
  return {
    ast,
    json: jsonString,
    getSourceCode () {
      return jsonSourceCode || (jsonSourceCode = new SourceCode(sourceCode.text, ast))
    }
  }
}

class LocatonFixer {
  constructor (sourceCode, offsetIndex, original, cooked) {
    this.sourceCode = sourceCode
    if (original === cooked) {
      const offsetLoc = sourceCode.getLocFromIndex(offsetIndex)
      this.getFixLoc = (line, column, _index) => {
        if (line === 1) {
          return { line: line + offsetLoc.line - 1, column: column + offsetLoc.column }
        } else {
          return { line: line + offsetLoc.line - 1, column }
        }
      }
    } else {
      const indexMap = new IndexMap(original, cooked)
      this.getFixLoc = (_line, _column, index) => {
        const origIndex = indexMap.remapIndex(index) + offsetIndex
        return sourceCode.getLocFromIndex(origIndex)
      }
    }
  }
  getFixLoc (line, column, _index) {
    // Defined by the constructor.
  }
  fixLocations (node) {
    const sourceCode = this.sourceCode
    const startLoc = this.getFixLoc(node.loc.start.line, node.loc.start.column, node.range[0])
    node.loc.start = startLoc
    node.range[0] = sourceCode.getIndexFromLoc(startLoc)

    const endLoc = this.getFixLoc(node.loc.end.line, node.loc.end.column, node.range[1])
    node.loc.end = endLoc
    node.range[1] = sourceCode.getIndexFromLoc(endLoc)
  }
}

/**
 * A class to remap the index which is shifted by HTML escape.
 */
class IndexMap {
  constructor (original, cooked) {
    this.mappers = []
    this.orgIndex = 0
    this.newIndex = 0
    this.batchLengthOrg = 0
    this.batchLengthNew = 0

    const results = diff(original, cooked)
    for (const [op, text] of results) {
      switch (op) {
        case diff.INSERT:
          this.applyIns(text)
          break
        case diff.DELETE:
          this.applyDel(text)
          break
        case diff.EQUAL:
          this.applyEq(text)
          break
        default:
          throw new Error(`Unexpected fast-diff operation "${op}"`)
      }
    }
    this.flush()
  }

  applyEq (text) {
    this.flush()
    const newEnd = this.newIndex + text.length
    const orgEnd = this.orgIndex + text.length
    this.addMap([this.orgIndex, orgEnd], [this.newIndex, newEnd])
    this.newIndex = newEnd
    this.orgIndex = orgEnd
  }

  applyIns (text) {
    this.batchLengthNew += text.length
  }

  applyDel (text) {
    this.batchLengthOrg += text.length
  }

  flush () {
    if (this.batchLengthNew || this.batchLengthOrg) {
      const newEnd = this.newIndex + this.batchLengthNew
      const orgEnd = this.orgIndex + this.batchLengthOrg
      this.addMap([this.orgIndex, orgEnd], [this.newIndex, newEnd])
      this.newIndex = newEnd
      this.orgIndex = orgEnd
      this.batchLengthOrg = 0
      this.batchLengthNew = 0
    }
  }

  addMap (orgRange, newRange) {
    if (orgRange[0] === newRange[0] && orgRange[1] === newRange[1]) {
      return
    }
    this.mappers.unshift({
      org: orgRange,
      new: newRange
    })
  }

  remapIndex (index) {
    for (const mapper of this.mappers) {
      if (mapper.new[0] <= index && index < mapper.new[1]) {
        const offset = index - mapper.new[0]
        return Math.min(mapper.org[0] + offset, mapper.org[1] - 1)
      }
    }
    return index
  }
}

module.exports = {
  parseJsonInI18nBlock
}
