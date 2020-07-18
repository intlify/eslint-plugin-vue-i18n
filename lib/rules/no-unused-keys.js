/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const jsonDiffPatch = require('jsondiffpatch').create({})
const flatten = require('flat')
const { collectKeysFromFiles, collectKeysFromAST } = require('../utils/collect-keys')
const collectLinkedKeys = require('../utils/collect-linked-keys')
const {
  UNEXPECTED_ERROR_LOCATION,
  getLocaleMessages,
  extractJsonInfo,
  generateJsonAst
} = require('../utils/index')
const debug = require('debug')('eslint-plugin-vue-i18n:no-unused-keys')

/**
 * @typedef {import('../utils/locale-messages').LocaleMessage} LocaleMessage
 */

/** @type {string[] | null} */
let cacheUsedLocaleMessageKeys = null // used locale message keys

/**
 * @param {RuleContext} context
 * @param {LocaleMessage} targetLocaleMessage
 * @param {string} json
 * @param {string[]} usedkeys
 */
function getUnusedKeys (context, targetLocaleMessage, json, usedkeys) {
  let unusedKeys = []

  try {
    const jsonValue = JSON.parse(json)

    let compareKeys = [
      ...usedkeys,
      ...collectLinkedKeys(jsonValue)
    ].reduce((values, current) => {
      values[current] = true
      return values
    }, {})
    if (targetLocaleMessage.localeKey === 'key') {
      compareKeys = targetLocaleMessage.locales.reduce((keys, locale) => {
        keys[locale] = compareKeys
        return keys
      }, {})
    }
    const diffValue = jsonDiffPatch.diff(
      flatten(compareKeys, { safe: true }),
      flatten(jsonValue, { safe: true })
    )
    const diffLocaleMessage = flatten(diffValue, { safe: true })
    Object.keys(diffLocaleMessage).forEach(key => {
      const value = diffLocaleMessage[key]
      if (value && Array.isArray(value) && value.length === 1) {
        unusedKeys.push(key)
      }
    })
  } catch (e) {
    context.report({
      loc: UNEXPECTED_ERROR_LOCATION,
      message: e.message
    })
    unusedKeys = null
  }

  return unusedKeys
}

function traverseJsonAstWithUnusedKeys (unusedKeys, ast, fn) {
  unusedKeys.forEach(key => {
    const fullpath = String(key)
    const paths = key.split('.')
    traverseNode(fullpath, paths, ast, fn)
  })
}

function traverseNode (fullpath, paths, ast, fn) {
  const path = paths.shift()
  if (ast.type === 'Object' && ast.children.length > 0) {
    ast.children.forEach(child => {
      if (child.type === 'Property') {
        const key = child.key
        if (key.type === 'Identifier' && key.value === path) {
          const value = child.value
          if (value.type === 'Object') {
            return traverseNode(fullpath, paths, value, fn)
          } else {
            return fn(fullpath, key)
          }
        }
      }
    })
  }
}

function create (context) {
  const filename = context.getFilename()

  function verifyJson (jsonString, jsonFilename, targetLocaleMessage, usedLocaleMessageKeys, offsetLoc = { line: 1, column: 1 }) {
    const ast = generateJsonAst(context, jsonString, jsonFilename)
    if (!ast) { return }

    const unusedKeys = getUnusedKeys(context, targetLocaleMessage, jsonString, usedLocaleMessageKeys)
    if (!unusedKeys) { return }

    traverseJsonAstWithUnusedKeys(unusedKeys, ast, (fullpath, node) => {
      let { line, column } = node.loc.start
      if (line === 1) {
        line += offsetLoc.line - 1
        column += offsetLoc.column - 1
      } else {
        line += offsetLoc.line - 1
      }
      context.report({
        message: `unused '${fullpath}' key'`,
        loc: { line, column }
      })
    })
  }

  if (extname(filename) === '.vue') {
    return {
      Program (node) {
        const documentFragment = context.parserServices.getDocumentFragment && context.parserServices.getDocumentFragment()
        /** @type {VElement[]} */
        const i18nBlocks = documentFragment && documentFragment.children.filter(node => node.type === 'VElement' && node.name === 'i18n') || []
        if (!i18nBlocks.length) {
          return
        }
        const localeMessages = getLocaleMessages(context)
        const usedLocaleMessageKeys = collectKeysFromAST(node, context.getSourceCode().visitorKeys)

        for (const block of i18nBlocks) {
          if (block.startTag.attributes.some(attr => !attr.directive && attr.key.name === 'src') || !block.endTag) {
            continue
          }
          const targetLocaleMessage = localeMessages.findBlockLocaleMessage(block)
          const tokenStore = context.parserServices.getTemplateBodyTokenStore()
          const tokens = tokenStore.getTokensBetween(block.startTag, block.endTag)
          const jsonString = tokens.map(t => t.value).join('')
          if (jsonString.trim()) {
            verifyJson(jsonString, filename, targetLocaleMessage, usedLocaleMessageKeys, block.startTag.loc.start)
          }
        }
      }
    }
  } else if (extname(filename) === '.json') {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-unused-keys`)
      return {}
    }
    const options = (context.options && context.options[0]) || {}
    const src = options.src || process.cwd()
    const extensions = options.extensions || ['.js', '.vue']

    const usedLocaleMessageKeys = cacheUsedLocaleMessageKeys || (cacheUsedLocaleMessageKeys = collectKeysFromFiles([src], extensions))

    return {
      Program (node) {
        const [jsonString, jsonFilename] = extractJsonInfo(context, node)
        if (!jsonString || !jsonFilename) { return }
        verifyJson(jsonString, jsonFilename, targetLocaleMessage, usedLocaleMessageKeys)
      }
    }
  } else {
    debug(`ignore ${filename} in no-unused-keys`)
    return {}
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow unused localization keys',
      category: 'Best Practices',
      recommended: false
    },
    fixable: false,
    schema: [{
      type: 'object',
      properties: {
        src: {
          type: 'string'
        },
        extensions: {
          type: 'array',
          items: { type: 'string' },
          default: ['.js', '.vue']
        }
      },
      additionalProperties: false
    }]
  },
  create
}
