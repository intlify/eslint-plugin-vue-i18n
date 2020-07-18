/**
 * @fileoverview Collect localization keys
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { CLIEngine } = require('eslint')
const vueESLintParser = require('vue-eslint-parser')
const { readFileSync } = require('fs')
const { resolve, extname } = require('path')
const { listFilesToProcess } = require('./glob-utils')
const debug = require('debug')('eslint-plugin-vue-i18n:collect-keys')

/**
 * @typedef {import('vue-eslint-parser').AST.Node} Node
 * @typedef {import('vue-eslint-parser').AST.ESLintCallExpression} CallExpression
 * @typedef {import('vue-eslint-parser').AST.VDirective} VDirective
 */

/**
 *
 * @param {CallExpression} node
 */
function getKeyFromCallExpression (node) {
  const funcName = (node.callee.type === 'MemberExpression' && node.callee.property.name) || node.callee.name

  if (!/^(\$t|t|\$tc|tc)$/.test(funcName) || !node.arguments || !node.arguments.length) {
    return null
  }

  const [keyNode] = node.arguments
  if (keyNode.type !== 'Literal') { return null }

  return keyNode.value ? keyNode.value : null
}

/**
 * @param {VDirective} node
 */
function getKeyFromVDirective (node) {
  if ((node.value && node.value.type === 'VExpressionContainer') &&
    (node.value.expression && node.value.expression.type === 'Literal')) {
    return node.value.expression.value
      ? node.value.expression.value
      : null
  } else {
    return null
  }
}

function getParser (parser) {
  if (parser) {
    try {
      return require(parser)
    } catch (_e) {
      // ignore
    }
  }
  return vueESLintParser
}

/**
 * Collect the used keys from source code text.
 * @param {string} text
 * @param {string} filename
 * @param {CLIEngine} cliEngine
 * @returns {string[]}
 */
function collectKeysFromText (text, filename, cliEngine) {
  const effectiveFilename = filename || '<text>'
  debug(`collectKeysFromFile ${effectiveFilename}`)
  const config = cliEngine.getConfigForFile(effectiveFilename)
  const parser = getParser(config.parser)

  const parserOptions = Object.assign({}, config.parserOptions, {
    loc: true,
    range: true,
    raw: true,
    tokens: true,
    comment: true,
    eslintVisitorKeys: true,
    eslintScopeManager: true,
    filePath: effectiveFilename
  })
  try {
    const parseResult = (typeof parser.parseForESLint === 'function')
      ? parser.parseForESLint(text, parserOptions)
      : { ast: parser.parse(text, parserOptions) }
    return collectKeysFromAST(parseResult.ast, parseResult.visitorKeys)
  } catch (_e) {
    return []
  }
}

/**
 * Collect the used keys from files.
 * @returns {string[]}
 */
function collectKeysFromFiles (files, extensions) {
  debug('collectKeysFromFiles', files, extensions)

  const cliEngine = new CLIEngine()

  const results = new Set()

  // detect used lodalization keys with linter
  for (const { filename, ignored } of listFilesToProcess(files, { extensions })) {
    debug(`Processing file ... ${filename}`)

    if (ignored) { continue }
    if (!extensions.includes(extname(filename))) { continue }

    const text = readFileSync(resolve(filename), 'utf8')

    for (const usedKey of collectKeysFromText(text, filename, cliEngine)) {
      results.add(usedKey)
    }
  }

  return [...results]
}

/**
 * Collect the used keys from Program node.
 * @returns {string[]}
 */
function collectKeysFromAST (node, visitorKeys) {
  debug('collectKeysFromAST')

  const results = new Set()
  /**
   * @param {Node} node
   */
  function enterNode (node) {
    if (node.type === 'VAttribute') {
      if (node.directive && (node.key.name.name === 't' || node.key.name === 't' /* parser v5 */)) {
        debug("call VAttribute[directive=true][key.name.name='t'] handling ...")
        const key = getKeyFromVDirective(node)
        if (key) {
          results.add(key)
        }
      }
    } else if (node.type === 'CallExpression') {
      debug('CallExpression handling ...')
      const key = getKeyFromCallExpression(node)
      if (key) {
        results.add(key)
      }
    }
  }

  if (node.templateBody) {
    vueESLintParser.AST.traverseNodes(node.templateBody, {
      enterNode,
      leaveNode () {}
    })
  }
  vueESLintParser.AST.traverseNodes(node, {
    visitorKeys: visitorKeys,
    enterNode,
    leaveNode () {}
  })

  return [...results]
}

module.exports = {
  collectKeysFromFiles,
  collectKeysFromAST
}
