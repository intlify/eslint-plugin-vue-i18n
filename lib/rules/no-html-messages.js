/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const parse5 = require('parse5')
const { getLocaleMessages } = require('../utils/index')
const { traverseNodes } = require('eslint-plugin-jsonc')
const debug = require('debug')('eslint-plugin-vue-i18n:no-html-messages')

/**
 * @typedef {import('eslint-plugin-jsonc').AST.JSONLiteral} JSONLiteral
 */

function findHTMLNode (node) {
  return node.childNodes.find(child => {
    if (child.nodeName !== '#text' && child.tagName) {
      return true
    }
  })
}

function create (context) {
  const filename = context.getFilename()

  /**
   * @param {JSONLiteral} node
   */
  function verifyJSONLiteral (node) {
    const parent = node.parent
    if (parent.type === 'JSONProperty' && parent.key === node) {
      return
    }
    const htmlNode = parse5.parseFragment(`${node.value}`, { sourceCodeLocationInfo: true })
    const foundNode = findHTMLNode(htmlNode)
    if (!foundNode) { return }
    const loc = {
      line: node.loc.start.line,
      column: node.loc.start.column + 1/* quote */ + foundNode.sourceCodeLocation.startOffset
    }
    context.report({
      message: `used HTML localization message`,
      loc
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

        for (const block of i18nBlocks) {
          if (block.startTag.attributes.some(attr => !attr.directive && attr.key.name === 'src')) {
            continue
          }

          const targetLocaleMessage = localeMessages.findBlockLocaleMessage(block)
          if (!targetLocaleMessage) {
            continue
          }
          const ast = targetLocaleMessage.getJsonAST()
          if (!ast) {
            continue
          }

          traverseNodes(ast, {
            enterNode (node) {
              if (node.type !== 'JSONLiteral') {
                return
              }
              verifyJSONLiteral(node)
            },
            leaveNode () {}
          })
        }
      }
    }
  } else if (context.parserServices.isJSON && getLocaleMessages(context).findExistLocaleMessage(filename)) {
    return {
      JSONLiteral: verifyJSONLiteral
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
