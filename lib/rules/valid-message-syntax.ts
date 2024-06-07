/**
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import { getStaticJSONValue } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { getStaticYAMLValue } from 'yaml-eslint-parser'
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import {
  getMessageSyntaxVersions,
  getReportIndex
} from '../utils/message-compiler/utils'
import { parse } from '../utils/message-compiler/parser'
import { parse as parseForV8 } from '../utils/message-compiler/parser-v8'
import type { CompileError } from '@intlify/message-compiler'
import { createRule } from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder('eslint-plugin-vue-i18n:valid-message-syntax')

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
  const allowNotString = Boolean(context.options[0]?.allowNotString)
  const messageSyntaxVersions = getMessageSyntaxVersions(context)

  function* extractMessageErrors(message: string) {
    if (messageSyntaxVersions.v9) {
      yield* parse(message).errors
    }
    if (messageSyntaxVersions.v8) {
      yield* parseForV8(message).errors
    }
  }
  function verifyMessage(
    message: string | number | undefined | null | boolean | bigint | RegExp,
    reportNode: JSONAST.JSONNode | YAMLAST.YAMLNode,
    getReportOffset: ((error: CompileError) => number | null) | null
  ) {
    if (typeof message !== 'string') {
      if (!allowNotString) {
        const type =
          message === null
            ? 'null'
            : message instanceof RegExp
              ? 'RegExp'
              : typeof message
        context.report({
          message: `Unexpected '${type}' message`,
          loc: reportNode.loc
        })
      }
    } else {
      for (const error of extractMessageErrors(message)) {
        messageSyntaxVersions.reportIfMissingSetting()

        const reportOffset = getReportOffset?.(error)
        context.report({
          message: error.message,
          loc:
            reportOffset != null
              ? sourceCode.getLocFromIndex(reportOffset)
              : reportNode.loc
        })
      }
    }
  }
  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(): RuleListener {
    function verifyExpression(
      node: JSONAST.JSONExpression | null,
      parent: JSONAST.JSONNode
    ) {
      let message
      let getReportOffset: ((error: CompileError) => number | null) | null =
        null
      if (node) {
        if (
          node.type === 'JSONArrayExpression' ||
          node.type === 'JSONObjectExpression'
        ) {
          return
        }
        message = getStaticJSONValue(node)
        getReportOffset = error =>
          getReportIndex(node, error.location!.start.offset)
      } else {
        message = null
      }

      verifyMessage(message, node || parent, getReportOffset)
    }
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        verifyExpression(node.value, node)
      },
      JSONArrayExpression(node: JSONAST.JSONArrayExpression) {
        for (const element of node.elements) {
          verifyExpression(element, node)
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
    function verifyContent(
      node: YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta | null,
      parent: YAMLAST.YAMLNode
    ) {
      let message
      let getReportOffset: ((error: CompileError) => number | null) | null =
        null
      if (node) {
        const valueNode = node.type === 'YAMLWithMeta' ? node.value : node
        if (
          !valueNode ||
          valueNode.type === 'YAMLMapping' ||
          valueNode.type === 'YAMLSequence'
        ) {
          return
        }
        message = getStaticYAMLValue(node) // Calculate the value including the tag.
        getReportOffset = error =>
          getReportIndex(valueNode, error.location!.start.offset)
      } else {
        message = null
      }
      if (message != null && typeof message === 'object') {
        return
      }

      verifyMessage(message, node || parent, getReportOffset)
    }
    return {
      YAMLPair(node: YAMLAST.YAMLPair) {
        if (withinKey(node)) {
          return
        }
        if (node.key != null) {
          yamlKeyNodes.add(node.key)
        }

        verifyContent(node.value, node)
      },
      YAMLSequence(node: YAMLAST.YAMLSequence) {
        if (withinKey(node)) {
          return
        }
        for (const entry of node.entries) {
          verifyContent(entry, node)
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
      debug(`ignore ${filename} in valid-message-syntax`)
      return {}
    }

    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson()
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml()
    }
    return {}
  } else {
    debug(`ignore ${filename} in valid-message-syntax`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'layout',
    docs: {
      description: 'disallow invalid message syntax',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/valid-message-syntax.html',
      recommended: true
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowNotString: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
