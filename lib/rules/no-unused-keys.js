/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { extname } = require('path')
const { collectKeysFromFiles, collectKeysFromAST } = require('../utils/collect-keys')
const collectLinkedKeys = require('../utils/collect-linked-keys')
const { getLocaleMessages } = require('../utils/index')
const { traverseNodes, getStaticJSONValue } = require('eslint-plugin-jsonc')
const debug = require('debug')('eslint-plugin-vue-i18n:no-unused-keys')

/**
 * @typedef {import('eslint-plugin-jsonc').AST.JSONNode} JSONNode
 */
/**
 * @typedef {import('../utils/locale-messages').LocaleMessage} LocaleMessage
 */

/** @type {string[] | null} */
let cacheUsedLocaleMessageKeys = null // used locale message keys

/**
 * @param {LocaleMessage} targetLocaleMessage
 * @param {object} jsonValue
 * @param {string[]} usedkeys
 */
function getUsedKeysMap (targetLocaleMessage, jsonValue, usedkeys) {
  const usedKeysMap = {}

  for (const key of [
    ...usedkeys,
    ...collectLinkedKeys(jsonValue)
  ]) {
    const paths = key.split('.')
    let map = usedKeysMap
    while (paths.length) {
      const path = paths.shift()
      map = map[path] = map[path] || {}
    }
  }

  if (targetLocaleMessage.localeKey === 'key') {
    return targetLocaleMessage.locales.reduce((keys, locale) => {
      keys[locale] = usedKeysMap
      return keys
    }, {})
  }
  return usedKeysMap
}

function create (context) {
  const filename = context.getFilename()
  const options = (context.options && context.options[0]) || {}
  const enableFix = options.enableFix

  /**
   * Create node visitor
   */
  function createVisitor (sourceCode, targetLocaleMessage, usedLocaleMessageKeys) {
    const jsonValue = getStaticJSONValue(sourceCode.ast)
    const usedKeys = getUsedKeysMap(targetLocaleMessage, jsonValue, usedLocaleMessageKeys)

    let pathStack = { usedKeys, keyPath: '' }
    const reports = []
    return {
      /**
       * @param {JSONNode} node
       */
      enterNode (node) {
        if (node.type === 'Program' ||
          node.type === 'JSONExpressionStatement' ||
          node.type === 'JSONProperty') {
          return
        }
        const parent = node.parent
        if (parent.type === 'JSONProperty' && parent.key === node) {
          return
        }
        let currKey = null
        let keyPath
        if (parent.type === 'JSONProperty') {
          currKey = parent.key.type === 'JSONLiteral' ? `${parent.key.value}` : parent.key.name
          keyPath = pathStack.keyPath ? `${pathStack.keyPath}.${currKey}` : currKey
        } else if (parent.type === 'JSONArrayExpression') {
          currKey = parent.elements.indexOf(node)
          keyPath = pathStack.keyPath ? `${pathStack.keyPath}[${currKey}]` : `[${currKey}]`
        } else {
          return
        }
        pathStack = {
          upper: pathStack,
          node,
          currKey,
          usedKeys: pathStack.usedKeys && pathStack.usedKeys[currKey] || false,
          keyPath
        }
        const isUnused = !pathStack.usedKeys
        if (isUnused && (
          node.type !== 'JSONObjectExpression' &&
          node.type !== 'JSONArrayExpression'
        )) {
          const reportNode = parent.type === 'JSONProperty' ? parent.key : node
          reports.push({
            node: reportNode,
            keyPath
          })
        }
      },
      /**
       * @param {JSONNode} node
       */
      leaveNode (node) {
        if (pathStack.node === node) {
          pathStack = pathStack.upper
        }
      },
      reports () {
        for (const { node, keyPath } of reports) {
          const fixRemoveKey = (fixer) => {
            return fixer.removeRange(fixRemoveRange(node))
          }
          context.report({
            message: `unused '${keyPath}' key`,
            loc: node.loc,
            fix: enableFix ? fixRemoveKey : null,
            suggest: [
              {
                desc: `Remove the '${keyPath}' key.`,
                fix: fixRemoveKey
              },
              (reports.length > 1 ? {
                desc: 'Remove all unused keys.',
                fix: fixAllRemoveKeys
              } : null)
            ].filter(s => s)
          })
        }

        function * fixAllRemoveKeys (fixer) {
          const ranges = reports.map(({ node: n }) => fixRemoveRange(n))

          let preLast = 0
          for (const range of ranges) {
            yield fixer.removeRange([Math.max(preLast, range[0]), range[1]])
            preLast = range[1]
          }
        }

        /**
         * @param {JSONNode} node
         */
        function fixRemoveRange (node) {
          const parent = node.parent
          let removeNode
          let isFirst = false
          let isLast = false
          if (parent.type === 'JSONProperty') {
            removeNode = parent
            const index = parent.parent.properties.indexOf(parent)
            isFirst = index === 0
            isLast = index === parent.parent.properties.length - 1
          } else {
            removeNode = node
            if (parent.type === 'JSONArrayExpression') {
              const index = parent.elements.indexOf(parent)
              isFirst = index === 0
              isLast = index === parent.elements.length - 1
            }
          }
          const range = [...removeNode.range]

          if (isLast || isFirst) {
            const after = sourceCode.getTokenAfter(removeNode)
            if (after && after.type === 'Punctuator' && after.value === ',') {
              range[1] = after.range[1]
            }
          }
          const before = sourceCode.getTokenBefore(removeNode)
          if (before) {
            if (before.type === 'Punctuator' && before.value === ',') {
              range[0] = before.range[0]
            } else {
              range[0] = before.range[1]
            }
          }
          return range
        }
      }
    }
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
          if (block.startTag.attributes.some(attr => !attr.directive && attr.key.name === 'src')) {
            continue
          }

          const targetLocaleMessage = localeMessages.findBlockLocaleMessage(block)
          if (!targetLocaleMessage) {
            continue
          }
          const jsonSourceCode = targetLocaleMessage.getJsonSourceCode()
          if (!jsonSourceCode) {
            continue
          }

          const { enterNode, leaveNode, reports } = createVisitor(jsonSourceCode, targetLocaleMessage, usedLocaleMessageKeys)
          traverseNodes(jsonSourceCode.ast, {
            enterNode,
            leaveNode
          })

          reports()
        }
      }
    }
  } else if (context.parserServices.isJSON) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-unused-keys`)
      return {}
    }
    const src = options.src || process.cwd()
    const extensions = options.extensions || ['.js', '.vue']

    const usedLocaleMessageKeys = cacheUsedLocaleMessageKeys || (cacheUsedLocaleMessageKeys = collectKeysFromFiles([src], extensions))
    const sourceCode = context.getSourceCode()
    const { enterNode, leaveNode, reports } = createVisitor(sourceCode, targetLocaleMessage, usedLocaleMessageKeys)

    return {
      '[type=/^JSON/]': enterNode,
      '[type=/^JSON/]:exit': leaveNode,
      'Program:exit' () {
        reports()
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
    fixable: 'code',
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
        },
        enableFix: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }]
  },
  create
}
