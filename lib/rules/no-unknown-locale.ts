import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { AST as VAST } from 'vue-eslint-parser'
import { extname } from 'path'
import { isLangCode } from 'is-language-code'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'
import {
  getLocaleMessages,
  defineCustomBlocksVisitor,
  getAttribute
} from '../utils/index'
import type { LocaleMessage } from '../utils/locale-messages'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder('eslint-plugin-vue-i18n:no-unknown-locale')

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
  const locales: string[] = context.options[0]?.locales || []
  const disableRFC5646 = context.options[0]?.disableRFC5646 || false

  function verifyLocaleCode(
    locale: string,
    reportNode: JSONAST.JSONNode | YAMLAST.YAMLNode | VAST.VAttribute | null
  ) {
    if (locales.includes(locale)) {
      return
    }
    if (!disableRFC5646 && isLangCode(locale).res) {
      return
    }
    context.report({
      message: "'{{locale}}' is unknown locale name",
      data: {
        locale
      },
      loc: reportNode?.loc || { line: 1, column: 0 }
    })
  }

  function createVerifyContext<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    targetLocaleMessage: LocaleMessage,
    block: VAST.VElement | null
  ) {
    type KeyStack =
      | {
          locale: null
          node?: N
          upper?: KeyStack
        }
      | {
          locale: string
          node?: N
          upper?: KeyStack
        }
    let keyStack: KeyStack
    if (targetLocaleMessage.isResolvedLocaleByFileName()) {
      const locale = targetLocaleMessage.locales[0]
      keyStack = {
        locale
      }
      verifyLocaleCode(locale, block && getAttribute(block, 'locale'))
    } else {
      keyStack = {
        locale: null
      }
    }

    // localeMessages.locales
    return {
      enterKey(key: string | number, node: N) {
        if (keyStack.locale == null) {
          const locale = String(key)
          keyStack = {
            node,
            locale,
            upper: keyStack
          }
          verifyLocaleCode(locale, node)
        } else {
          keyStack = {
            node,
            locale: keyStack.locale,
            upper: keyStack
          }
        }
      },
      leaveKey(node: N | null) {
        if (keyStack.node === node) {
          keyStack = keyStack.upper!
        }
      }
    }
  }

  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(
    targetLocaleMessage: LocaleMessage,
    block: VAST.VElement | null
  ): RuleListener {
    const ctx = createVerifyContext(targetLocaleMessage, block)
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        const key =
          node.key.type === 'JSONLiteral' ? `${node.key.value}` : node.key.name

        ctx.enterKey(key, node.key)
      },
      'JSONProperty:exit'(node: JSONAST.JSONProperty) {
        ctx.leaveKey(node.key)
      },
      'JSONArrayExpression > *'(
        node: JSONAST.JSONArrayExpression['elements'][number] & {
          parent: JSONAST.JSONArrayExpression
        }
      ) {
        const key = node.parent.elements.indexOf(node)
        ctx.enterKey(key, node)
      },
      'JSONArrayExpression > *:exit'(
        node: JSONAST.JSONArrayExpression['elements'][number]
      ) {
        ctx.leaveKey(node)
      }
    }
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(
    targetLocaleMessage: LocaleMessage,
    block: VAST.VElement | null
  ): RuleListener {
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

    const ctx = createVerifyContext(targetLocaleMessage, block)

    return {
      YAMLPair(node: YAMLAST.YAMLPair) {
        if (node.key != null) {
          if (withinKey(node)) {
            return
          }
          yamlKeyNodes.add(node.key)
        }

        if (node.key != null && node.key.type === 'YAMLScalar') {
          const keyValue = node.key.value
          const key = typeof keyValue === 'string' ? keyValue : String(keyValue)

          ctx.enterKey(key, node.key)
        }
      },
      'YAMLPair:exit'(node: YAMLAST.YAMLPair) {
        if (node.key != null) {
          ctx.leaveKey(node.key)
        }
      },
      'YAMLSequence > *'(
        node: YAMLAST.YAMLSequence['entries'][number] & {
          parent: YAMLAST.YAMLSequence
        }
      ) {
        if (withinKey(node)) {
          return
        }
        const key = node.parent.entries.indexOf(node)
        ctx.enterKey(key, node)
      },
      'YAMLSequence > *:exit'(node: YAMLAST.YAMLSequence['entries'][number]) {
        ctx.leaveKey(node)
      }
    }
  }

  if (extname(filename) === '.vue') {
    return defineCustomBlocksVisitor(
      context,
      ctx => {
        const localeMessages = getLocaleMessages(context)
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        return createVisitorForJson(
          targetLocaleMessage,
          ctx.parserServices.customBlock
        )
      },
      ctx => {
        const localeMessages = getLocaleMessages(context)
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        return createVisitorForYaml(
          targetLocaleMessage,
          ctx.parserServices.customBlock
        )
      }
    )
  } else if (
    sourceCode.parserServices.isJSON ||
    sourceCode.parserServices.isYAML
  ) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-unknown-locale`)
      return {}
    }

    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson(targetLocaleMessage, null)
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml(targetLocaleMessage, null)
    }
    return {}
  } else {
    debug(`ignore ${filename} in no-unknown-locale`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow unknown locale name',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-unknown-locale.html',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          locales: {
            type: 'array',
            items: { type: 'string' }
          },
          disableRFC5646: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
