/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { extname } from 'path'
import parse5 from 'parse5'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { RuleContext, RuleListener } from '../types'

const debug = debugBuilder('eslint-plugin-vue-i18n:no-html-messages')

function findHTMLNode(
  node: parse5.DocumentFragment
): parse5.Element | undefined {
  return node.childNodes.find((child): child is parse5.Element => {
    if (child.nodeName !== '#text' && (child as parse5.Element).tagName) {
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
    }) as parse5.DocumentFragment
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
    }) as parse5.DocumentFragment
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
