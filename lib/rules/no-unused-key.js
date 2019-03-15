/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const jsonAstParse = require('json-to-ast')
const jsonDiffPatch = require('jsondiffpatch').create({})
const flatten = require('flat')
const collectKeys = require('../utils/collect-keys')
const { loadLocaleMessages } = require('../utils/index')
const debug = require('debug')('eslint-plugin-vue-i18n:no-unused-key')

let usedLocaleMessageKeys = null // used locale message keys
let localeMessages = null // used locale messages

function findExistLocaleMessage (fullpath, localeMessages) {
  return localeMessages.find(message => message.fullpath === fullpath)
}

function getUnusedKeys (diffLocaleMessage) {
  const unusedKeys = []
  Object.keys(diffLocaleMessage).forEach(key => {
    const value = diffLocaleMessage[key]
    if (value && Array.isArray(value) && value.length === 1) {
      unusedKeys.push(key)
    }
  })
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
    debug(`ignore ${filename} in no-unused-key`)
    return {}
  }

  const { settings } = context
  if (!settings['vue-i18n'] || !settings['vue-i18n'].localeDir) {
    // TODO: should be error
    return {}
  }
  localeMessages = localeMessages || loadLocaleMessages(settings['vue-i18n'].localeDir)

  const targetLocaleMessage = findExistLocaleMessage(filename, localeMessages)
  if (!targetLocaleMessage) {
    debug(`ignore ${filename} in no-unused-key`)
    return {}
  }

  const { extensions } = (context.options && context.options[0]) || { extensions: ['.js', '.vue'] }
  const src = [process.cwd()] || ['.']

  if (!usedLocaleMessageKeys) {
    usedLocaleMessageKeys = collectKeys(src, extensions)
  }

  return {
    Program (node) {
      const [stringNode, filenameNode] = node.comments
      const jsonString = Buffer.from(stringNode.value, 'base64').toString()
      const jsonFilename = Buffer.from(filenameNode.value, 'base64').toString()
      const jsonValue = JSON.parse(jsonString)
      try {
        const diffValue = jsonDiffPatch.diff(
          flatten(usedLocaleMessageKeys, { safe: true }),
          flatten(jsonValue, { safe: true })
        )
        const diffLocaleMessage = flatten(diffValue, { safe: true })
        const unusedKeys = getUnusedKeys(diffLocaleMessage)

        const jsonAstSettings = { loc: true, source: jsonFilename }
        const ast = jsonAstParse(jsonString, jsonAstSettings)
        traverseJsonAstWithUnusedKeys(unusedKeys, ast, (fullpath, node) => {
          const { line, column } = node.loc.start
          context.report({
            message: `unused '${fullpath}' key in '${targetLocaleMessage.path}'`,
            loc: { line, column }
          })
        })
      } catch ({ message, line, column }) {
        context.report({
          message,
          loc: { line, column }
        })
      }
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
