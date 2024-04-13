/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'node:path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import {
  getMessageSyntaxVersions,
  getReportIndex,
  NodeTypes
} from '../utils/message-compiler/utils'
import { parse } from '../utils/message-compiler/parser'
import { traverseNode } from '../utils/message-compiler/traverser'
import { createRule } from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder('eslint-plugin-vue-i18n:no-deprecated-modulo-syntax')

type GetReportOffset = (offset: number) => number | null

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
    if (messageSyntaxVersions.v9 && messageSyntaxVersions.v8) {
      // This rule cannot support two versions in the same project.
      return
    }

    if (messageSyntaxVersions.v9) {
      verifyForV9(message, reportNode, getReportOffset)
    } else if (messageSyntaxVersions.v8) {
      return
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
      return createVisitorForJson()
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml()
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
