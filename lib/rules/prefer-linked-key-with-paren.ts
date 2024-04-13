/**
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { RuleContext, RuleListener } from '../types'
import type { GetReportOffset } from '../utils/rule'
import type { CustomBlockVisitorFactory } from '../types/vue-parser-services'
import { extname } from 'node:path'
import debugBuilder from 'debug'
import {
  createRule,
  defineCreateVisitorForJson,
  defineCreateVisitorForYaml
} from '../utils/rule'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import {
  getMessageSyntaxVersions,
  NodeTypes
} from '../utils/message-compiler/utils'
import { parse } from '../utils/message-compiler/parser'
import { parse as parseForV8 } from '../utils/message-compiler/parser-v8'
import { traverseNode } from '../utils/message-compiler/traverser'
import { getFilename, getSourceCode } from '../utils/compat'

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

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
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

  const createVisitorForJson = defineCreateVisitorForJson(verifyMessage)
  const createVisitorForYaml = defineCreateVisitorForYaml(verifyMessage)

  if (extname(filename) === '.vue') {
    return defineCustomBlocksVisitor(
      context,
      createVisitorForJson,
      createVisitorForYaml
    )
  } else if (
    sourceCode.parserServices.isJSON ||
    sourceCode.parserServices.isYAML
  ) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in prefer-linked-key-with-paren`)
      return {}
    }

    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson(
        context as Parameters<CustomBlockVisitorFactory>[0]
      )
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml(
        context as Parameters<CustomBlockVisitorFactory>[0]
      )
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
