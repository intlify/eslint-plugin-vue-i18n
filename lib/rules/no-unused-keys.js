/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const jsonDiffPatch = require('jsondiffpatch').create({})
const flatten = require('flat')
const collectKeys = require('../utils/collect-keys')
const {
  UNEXPETECD_ERROR_LOCATION,
  findExistLocaleMessage,
  getLocaleMessages,
  extractJsonInfo,
  generateJsonAst
} = require('../utils/index')
const debug = require('debug')('eslint-plugin-vue-i18n:no-unused-keys')

let usedLocaleMessageKeys = null // used locale message keys

function getUnusedKeys (context, json, usedkeys) {
  let unusedKeys = []

  try {
    const jsonValue = JSON.parse(json)
    const diffValue = jsonDiffPatch.diff(
      flatten(usedkeys, { safe: true }),
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
      loc: UNEXPETECD_ERROR_LOCATION,
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
  if (extname(filename) !== '.json') {
    debug(`ignore ${filename} in no-unused-keys`)
    return {}
  }

  const { settings } = context
  if (!settings['vue-i18n'] || !settings['vue-i18n'].localeDir) {
    context.report({
      loc: UNEXPETECD_ERROR_LOCATION,
      message: `You need to 'localeDir' at 'settings. See the 'eslint-plugin-vue-i18n documentation`
    })
    return {}
  }

  const localeMessages = getLocaleMessages(settings['vue-i18n'].localeDir)
  const targetLocaleMessage = findExistLocaleMessage(filename, localeMessages)
  if (!targetLocaleMessage) {
    debug(`ignore ${filename} in no-unused-keys`)
    return {}
  }

  const options = (context.options && context.options[0]) || {}
  const src = options.src || process.cwd()
  const extensions = options.extensions || ['.js', '.vue']

  if (!usedLocaleMessageKeys) {
    usedLocaleMessageKeys = collectKeys([src], extensions)
  }

  return {
    Program (node) {
      const [jsonString, jsonFilename] = extractJsonInfo(context, node)
      if (!jsonString || !jsonFilename) { return }

      const ast = generateJsonAst(context, jsonString, jsonFilename)
      if (!ast) { return }

      const unusedKeys = getUnusedKeys(context, jsonString, usedLocaleMessageKeys)
      if (!unusedKeys) { return }

      traverseJsonAstWithUnusedKeys(unusedKeys, ast, (fullpath, node) => {
        const { line, column } = node.loc.start
        context.report({
          message: `unused '${fullpath}' key in '${targetLocaleMessage.path}'`,
          loc: { line, column }
        })
      })
    }
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
