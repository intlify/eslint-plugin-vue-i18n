/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { RuleContext, RuleListener } from '../types'
import type { GetReportOffset } from '../utils/rule'
import type { CustomBlockVisitorFactory } from '../types/vue-parser-services'
import { extname } from 'node:path'
import debugBuilder from 'debug'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import {
  getMessageSyntaxVersions,
  NodeTypes
} from '../utils/message-compiler/utils'
import { parse } from '../utils/message-compiler/parser'
import { traverseNode } from '../utils/message-compiler/traverser'
import {
  createRule,
  defineCreateVisitorForJson,
  defineCreateVisitorForYaml
} from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'

const debug = debugBuilder('eslint-plugin-vue-i18n:no-deprecated-modulo-syntax')

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
      if (node.type !== NodeTypes.Named || !node.modulo) {
        return
      }
      let range: [number, number] | null = null
      const start = getReportOffset(node.loc!.start.offset)
      const end = getReportOffset(node.loc!.end.offset)
      if (start != null && end != null) {
        // Subtract `%` length (1), because we want to fix modulo
        range = [start - 1, end]
      }
      context.report({
        loc: range
          ? {
              start: sourceCode.getLocFromIndex(range[0]),
              end: sourceCode.getLocFromIndex(range[1])
            }
          : reportNode.loc,
        message:
          'The modulo interpolation must be enforced to named interpolation.',
        fix(fixer) {
          return range ? fixer.removeRange([range[0], range[0] + 1]) : null
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
    if (messageSyntaxVersions.v9) {
      verifyForV9(message, reportNode, getReportOffset)
    } else if (messageSyntaxVersions.v8) {
      return
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
      debug(`ignore ${filename} in no-deprecated-modulo-syntax`)
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
    debug(`ignore ${filename} in no-deprecated-modulo-syntax`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce modulo interpolation to be named interpolation',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-deprecated-modulo-syntax.html',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create
})
