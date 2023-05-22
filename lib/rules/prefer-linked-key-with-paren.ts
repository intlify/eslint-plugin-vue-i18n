/**
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import {
  getMessageSyntaxVersions,
  getReportIndex,
  NodeTypes
} from '../utils/message-compiler/utils'
import { parse } from '../utils/message-compiler/parser'
import { parse as parseForV8 } from '../utils/message-compiler/parser-v8'
import { traverseNode } from '../utils/message-compiler/traverser'
import { createRule } from '../utils/rule'
const debug = debugBuilder(
  'eslint-plugin-vue-i18n:prefer-linked-key-with-paren'
)

function getSingleQuote(node: JSONAST.JSONStringLiteral | YAMLAST.YAMLScalar) {
  if (node.type === 'JSONLiteral') {
    return node.raw[0] !== "'" ? "'" : "\\'"
  }
  if (node.style === 'single-quoted') {
    return "''"
  }
  return "'"
}

type GetReportOffset = (offset: number) => number | null

function create(context: RuleContext): RuleListener {
  const filename = context.getFilename()
  const sourceCode = context.getSourceCode()
  const messageSyntaxVersions = getMessageSyntaxVersions(context)

  function verifyForV9(
    message: string,
    reportNode: JSONAST.JSONStringLiteral | YAMLAST.YAMLScalar,
    getReportOffset: GetReportOffset
  ) {
    const { ast, errors } = parse(message)
    if (errors.length) {
      return
    }
    traverseNode(ast, node => {
      if (node.type !== NodeTypes.LinkedKey) {
        return
      }
      let range: [number, number] | null = null
      const start = getReportOffset(node.loc!.start.offset)
      const end = getReportOffset(node.loc!.end.offset)
      if (start != null && end != null) {
        range = [start, end]
      }
      context.report({
        loc: range
          ? {
              start: sourceCode.getLocFromIndex(range[0]),
              end: sourceCode.getLocFromIndex(range[1])
            }
          : reportNode.loc,
        message: 'The linked message key must be enclosed in brackets.',
        fix(fixer) {
          if (!range) {
            return null
          }
          const single = getSingleQuote(reportNode)
          return [
            fixer.insertTextBeforeRange(range, `{${single}`),
            fixer.insertTextAfterRange(range, `${single}}`)
          ]
        }
      })
    })
  }

  function verifyForV8(
    message: string,
    reportNode: JSONAST.JSONStringLiteral | YAMLAST.YAMLScalar,
    getReportOffset: GetReportOffset
  ) {
    const { ast, errors } = parseForV8(message)
    if (errors.length) {
      return
    }
    traverseNode(ast, node => {
      if (node.type !== NodeTypes.LinkedKey) {
        return
      }
      if (message[node.loc!.start.offset - 1] === '(') {
        return
      }
      let range: [number, number] | null = null
      const start = getReportOffset(node.loc!.start.offset)
      const end = getReportOffset(node.loc!.end.offset)
      if (start != null && end != null) {
        range = [start, end]
      }
      context.report({
        loc: range
          ? {
              start: sourceCode.getLocFromIndex(range[0]),
              end: sourceCode.getLocFromIndex(range[1])
            }
          : reportNode.loc,
        message: 'The linked message key must be enclosed in parentheses.',
        fix(fixer) {
          if (!range) {
            return null
          }
          return [
            fixer.insertTextBeforeRange(range, '('),
            fixer.insertTextAfterRange(range, ')')
          ]
        }
      })
    })
  }

  function verifyMessage(
    message: string,
    reportNode: JSONAST.JSONStringLiteral | YAMLAST.YAMLScalar,
    getReportOffset: GetReportOffset
  ) {
    if (messageSyntaxVersions.reportIfMissingSetting()) {
      return
    }
    if (messageSyntaxVersions.v9 && messageSyntaxVersions.v8) {
      // This rule cannot support two versions in the same project.
      return
    }

    if (messageSyntaxVersions.v9) {
      verifyForV9(message, reportNode, getReportOffset)
    } else if (messageSyntaxVersions.v8) {
      verifyForV8(message, reportNode, getReportOffset)
    }
  }
  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(): RuleListener {
    function verifyExpression(node: JSONAST.JSONExpression) {
      if (node.type !== 'JSONLiteral' || typeof node.value !== 'string') {
        return
      }
      verifyMessage(node.value, node as JSONAST.JSONStringLiteral, offset =>
        getReportIndex(node, offset)
      )
    }
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        verifyExpression(node.value)
      },
      JSONArrayExpression(node: JSONAST.JSONArrayExpression) {
        for (const element of node.elements) {
          if (element) verifyExpression(element)
        }
      }
    }
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(): RuleListener {
    const yamlKeyNodes = new Set<YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta>()
    function withinKey(node: YAMLAST.YAMLNode) {
      for (const keyNode of yamlKeyNodes) {
        if (
          keyNode.range[0] <= node.range[0] &&
          node.range[0] < keyNode.range[1]
        ) {
          return true
        }
      }
      return false
    }
    function verifyContent(node: YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta) {
      const valueNode = node.type === 'YAMLWithMeta' ? node.value : node
      if (
        !valueNode ||
        valueNode.type !== 'YAMLScalar' ||
        typeof valueNode.value !== 'string'
      ) {
        return
      }
      verifyMessage(valueNode.value, valueNode, offset =>
        getReportIndex(valueNode, offset)
      )
    }
    return {
      YAMLPair(node: YAMLAST.YAMLPair) {
        if (withinKey(node)) {
          return
        }
        if (node.key != null) {
          yamlKeyNodes.add(node.key)
        }

        if (node.value) verifyContent(node.value)
      },
      YAMLSequence(node: YAMLAST.YAMLSequence) {
        if (withinKey(node)) {
          return
        }
        for (const entry of node.entries) {
          if (entry) verifyContent(entry)
        }
      }
    }
  }

  if (extname(filename) === '.vue') {
    return defineCustomBlocksVisitor(
      context,
      createVisitorForJson,
      createVisitorForYaml
    )
  } else if (context.parserServices.isJSON || context.parserServices.isYAML) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in prefer-linked-key-with-paren`)
      return {}
    }

    if (context.parserServices.isJSON) {
      return createVisitorForJson()
    } else if (context.parserServices.isYAML) {
      return createVisitorForYaml()
    }
    return {}
  } else {
    debug(`ignore ${filename} in prefer-linked-key-with-paren`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'layout',
    docs: {
      description: 'enforce linked key to be enclosed in parentheses',
      category: 'Stylistic Issues',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/prefer-linked-key-with-paren.html',
      recommended: false
    },
    fixable: 'code',
    schema: []
  },
  create
})
