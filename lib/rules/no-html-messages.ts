/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { extname } from 'path'
import parse5 from 'parse5'
import { getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { RuleContext, RuleListener } from '../types'

const debug = debugBuilder('eslint-plugin-vue-i18n:no-html-messages')

function findHTMLNode(
  node: parse5.DefaultTreeDocumentFragment
): parse5.DefaultTreeElement | undefined {
  return node.childNodes.find((child): child is parse5.DefaultTreeElement => {
    if (
      child.nodeName !== '#text' &&
      (child as parse5.DefaultTreeElement).tagName
    ) {
      return true
    }
    return false
  })
}

function create(context: RuleContext): RuleListener {
  const filename = context.getFilename()

  /**
   * @param {JSONLiteral} node
   */
  function verifyJSONLiteral(node: JSONAST.JSONLiteral) {
    const parent = node.parent!
    if (parent.type === 'JSONProperty' && parent.key === node) {
      return
    }
    const htmlNode = parse5.parseFragment(`${node.value}`, {
      sourceCodeLocationInfo: true
    }) as parse5.DefaultTreeDocumentFragment
    const foundNode = findHTMLNode(htmlNode)
    if (!foundNode) {
      return
    }
    const loc = {
      line: node.loc.start.line,
      column:
        node.loc.start.column +
        1 /* quote */ +
        foundNode.sourceCodeLocation!.startOffset
    }
    context.report({
      message: `used HTML localization message`,
      loc
    })
  }

  /**
   * @param {YAMLScalar} node
   */
  function verifyYAMLScalar(node: YAMLAST.YAMLScalar) {
    const parent = node.parent
    if (parent.type === 'YAMLPair' && parent.key === node) {
      return
    }
    const htmlNode = parse5.parseFragment(`${node.value}`, {
      sourceCodeLocationInfo: true
    }) as parse5.DefaultTreeDocumentFragment
    const foundNode = findHTMLNode(htmlNode)
    if (!foundNode) {
      return
    }
    const loc = {
      line: node.loc.start.line,
      column:
        node.loc.start.column +
        1 /* quote */ +
        foundNode.sourceCodeLocation!.startOffset
    }
    context.report({
      message: `used HTML localization message`,
      loc
    })
  }

  if (extname(filename) === '.vue') {
    return {
      Program() {
        const documentFragment =
          context.parserServices.getDocumentFragment &&
          context.parserServices.getDocumentFragment()
        /** @type {VElement[]} */
        const i18nBlocks =
          (documentFragment &&
            documentFragment.children.filter(
              (node): node is VAST.VElement =>
                node.type === 'VElement' && node.name === 'i18n'
            )) ||
          []
        if (!i18nBlocks.length) {
          return
        }
        const localeMessages = getLocaleMessages(context)

        for (const block of i18nBlocks) {
          if (
            block.startTag.attributes.some(
              attr => !attr.directive && attr.key.name === 'src'
            )
          ) {
            continue
          }

          const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
            block
          )
          if (!targetLocaleMessage) {
            continue
          }
          targetLocaleMessage.traverseNodes({
            enterNode(node) {
              if (node.type === 'JSONLiteral') {
                verifyJSONLiteral(node)
              } else if (node.type === 'YAMLScalar') {
                verifyYAMLScalar(node)
              }
            },
            leaveNode() {
              // noop
            }
          })
        }
      }
    }
  } else if (context.parserServices.isJSON) {
    if (!getLocaleMessages(context).findExistLocaleMessage(filename)) {
      return {}
    }
    return {
      JSONLiteral: verifyJSONLiteral
    }
  } else if (context.parserServices.isYAML) {
    if (!getLocaleMessages(context).findExistLocaleMessage(filename)) {
      return {}
    }
    return {
      YAMLScalar: verifyYAMLScalar
    }
  } else {
    debug(`ignore ${filename} in no-html-messages`)
    return {}
  }
}

export = {
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
