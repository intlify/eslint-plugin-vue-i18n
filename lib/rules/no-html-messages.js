/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const jsonAstParse = require('json-to-ast')
const parse5 = require('parse5')
const { UNEXPETECD_ERROR_LOCATION, loadLocaleMessages } = require('../utils/index')
const debug = require('debug')('eslint-plugin-vue-i18n:no-html-messages')

let localeMessages = null // used locale messages
let localeDir = null

function findExistLocaleMessage (fullpath, localeMessages) {
  return localeMessages.find(message => message.fullpath === fullpath)
}

function extractJsonInfo (context, node) {
  try {
    const [str, filename] = node.comments
    return [
      Buffer.from(str.value, 'base64').toString(),
      Buffer.from(filename.value, 'base64').toString()
    ]
  } catch (e) {
    context.report({
      loc: UNEXPETECD_ERROR_LOCATION,
      message: e.message
    })
    return []
  }
}

function generateJsonAst (context, json, filename) {
  let ast = null

  try {
    ast = jsonAstParse(json, { loc: true, source: filename })
  } catch (e) {
    const { message, line, column } = e
    context.report({
      message,
      loc: { line, column }
    })
  }

  return ast
}

function traverseNode (node, fn) {
  if (node.type === 'Object' && node.children.length > 0) {
    node.children.forEach(child => {
      if (child.type === 'Property') {
        const keyNode = child.key
        const valueNode = child.value
        if (keyNode.type === 'Identifier' && valueNode.type === 'Object') {
          return traverseNode(valueNode, fn)
        } else {
          return fn(valueNode)
        }
      }
    })
  }
}

function findHTMLNode (node) {
  return node.childNodes.find(child => {
    if (child.nodeName !== '#text' && child.tagName) {
      return true
    }
  })
}

function create (context) {
  const filename = context.getFilename()
  if (extname(filename) !== '.json') {
    debug(`ignore ${filename} in no-html-messages`)
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

  if (localeDir !== settings['vue-i18n'].localeDir) {
    debug(`change localeDir: ${localeDir} -> ${settings['vue-i18n'].localeDir}`)
    localeDir = settings['vue-i18n'].localeDir
    localeMessages = loadLocaleMessages(localeDir)
  } else {
    localeMessages = localeMessages || loadLocaleMessages(settings['vue-i18n'].localeDir)
  }

  const targetLocaleMessage = findExistLocaleMessage(filename, localeMessages)
  if (!targetLocaleMessage) {
    debug(`ignore ${filename} in no-html-messages`)
    return {}
  }

  return {
    Program (node) {
      const [jsonString, jsonFilename] = extractJsonInfo(context, node)
      if (!jsonString || !jsonFilename) { return }

      const ast = generateJsonAst(context, jsonString, jsonFilename)
      if (!ast) { return }

      traverseNode(ast, messageNode => {
        const htmlNode = parse5.parseFragment(messageNode.value, { sourceCodeLocationInfo: true })
        const foundNode = findHTMLNode(htmlNode)
        if (!foundNode) { return }
        context.report({
          message: `used HTML localization message in '${targetLocaleMessage.path}'`,
          loc: {
            line: messageNode.loc.start.line,
            column: messageNode.loc.start.column + foundNode.sourceCodeLocation.startOffset
          }
        })
      })
    }
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow use HTML localization messages',
      category: 'Recommended',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
}
