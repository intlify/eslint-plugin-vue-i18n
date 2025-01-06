/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { extname } from 'path'
import * as parse5 from 'parse5'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'
import type { DefaultTreeAdapterMap } from 'parse5'
import { getFilename, getSourceCode } from '../utils/compat'

const debug = debugBuilder('eslint-plugin-vue-i18n:no-html-messages')

type DocumentFragment = DefaultTreeAdapterMap['documentFragment']
type Element = DefaultTreeAdapterMap['element']
function findHTMLNode(node: DocumentFragment): Element | undefined {
  return node.childNodes.find((child): child is Element => {
    if (child.nodeName !== '#text' && (child as Element).tagName) {
      return true
    }
    return false
  })
}

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)

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
    })
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
    })
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
    return defineCustomBlocksVisitor(
      context,
      () => {
        return {
          JSONLiteral: verifyJSONLiteral
        }
      },
      () => {
        return {
          YAMLScalar: verifyYAMLScalar
        }
      }
    )
  } else if (sourceCode.parserServices.isJSON) {
    if (!getLocaleMessages(context).findExistLocaleMessage(filename)) {
      return {}
    }
    return {
      JSONLiteral: verifyJSONLiteral
    }
  } else if (sourceCode.parserServices.isYAML) {
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

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow use HTML localization messages',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-html-messages.html',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
})
