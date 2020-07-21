/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const parse5 = require('parse5')
const {
  getLocaleMessages,
  extractJsonInfo,
  generateJsonAst
} = require('../utils/index')
const debug = require('debug')('eslint-plugin-vue-i18n:no-html-messages')

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

  function verifyJson (jsonString, jsonFilename, offsetLoc = { line: 1, column: 1 }) {
    const ast = generateJsonAst(context, jsonString, jsonFilename)
    if (!ast) { return }

    traverseNode(ast, messageNode => {
      const htmlNode = parse5.parseFragment(messageNode.value, { sourceCodeLocationInfo: true })
      const foundNode = findHTMLNode(htmlNode)
      if (!foundNode) { return }
      const loc = {
        line: messageNode.loc.start.line,
        column: messageNode.loc.start.column + foundNode.sourceCodeLocation.startOffset
      }
      if (loc.line === 1) {
        loc.line += offsetLoc.line - 1
        loc.column += offsetLoc.column - 1
      } else {
        loc.line += offsetLoc.line - 1
      }
      context.report({
        message: `used HTML localization message`,
        loc
      })
    })
  }

  if (extname(filename) === '.vue') {
    return {
      Program (node) {
        const documentFragment = context.parserServices.getDocumentFragment && context.parserServices.getDocumentFragment()
        /** @type {VElement[]} */
        const i18nBlocks = documentFragment && documentFragment.children.filter(node => node.type === 'VElement' && node.name === 'i18n') || []

        for (const block of i18nBlocks) {
          if (block.startTag.attributes.some(attr => !attr.directive && attr.key.name === 'src') || !block.endTag) {
            continue
          }
          const tokenStore = context.parserServices.getTemplateBodyTokenStore()
          const tokens = tokenStore.getTokensBetween(block.startTag, block.endTag)
          const jsonString = tokens.map(t => t.value).join('')
          if (jsonString.trim()) {
            verifyJson(jsonString, filename, block.startTag.loc.start)
          }
        }
      }
    }
  } else if (extname(filename) === '.json' && getLocaleMessages(context).findExistLocaleMessage(filename)) {
    return {
      Program (node) {
        const [jsonString, jsonFilename] = extractJsonInfo(context, node)
        if (!jsonString || !jsonFilename) { return }
        verifyJson(jsonString, jsonFilename)
      }
    }
  } else {
    debug(`ignore ${filename} in no-html-messages`)
    return {}
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
