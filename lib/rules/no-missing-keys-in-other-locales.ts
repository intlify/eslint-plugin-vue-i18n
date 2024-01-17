/**
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type {
  I18nLocaleMessageDictionary,
  RuleContext,
  RuleListener
} from '../types'
import type { LocaleMessage, LocaleMessages } from '../utils/locale-messages'
import { joinPath } from '../utils/key-path'
import { createRule } from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder(
  'eslint-plugin-vue-i18n:no-missing-keys-in-other-locales'
)

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
  const ignoreLocales: string[] = context.options[0]?.ignoreLocales || []

  function reportMissing(
    keyPath: (string | number)[],
    locales: string[],
    reportNode: JSONAST.JSONNode | YAMLAST.YAMLNode
  ) {
    const quotedLocales = locales.map(s => `'${s}'`)
    context.report({
      message: "'{{path}}' does not exist in {{locales}} locale(s)",
      data: {
        path: joinPath(...keyPath),
        locales: [quotedLocales.pop(), quotedLocales.join(', ')]
          .filter(loc => loc)
          .reverse()
          .join(' and ')
      },
      loc: reportNode.loc
    })
  }

  function isLeafMessageNode(
    node:
      | JSONAST.JSONExpression
      | YAMLAST.YAMLContent
      | YAMLAST.YAMLWithMeta
      | null
  ): boolean {
    if (node == null) {
      // null is considered to be a branch, considering the possibility of being described.
      return false
    }
    if (node.type === 'JSONLiteral') {
      if (node.value == null && node.regex == null && node.bigint == null) {
        // null is considered to be a branch, considering the possibility of being described.
        return false
      }
      return true
    }
    if (node.type === 'JSONIdentifier' || node.type === 'JSONTemplateLiteral') {
      return true
    }
    if (node.type === 'JSONUnaryExpression') {
      return isLeafMessageNode(node.argument)
    }
    if (node.type === 'YAMLScalar') {
      if (node.value == null) {
        // null is considered to be a branch, considering the possibility of being described.
        return false
      }
      return true
    }
    if (node.type === 'YAMLWithMeta') {
      return isLeafMessageNode(node.value)
    }
    if (node.type === 'YAMLAlias') {
      return true
    }
    return false
  }

  function createVerifyContext<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    targetLocaleMessage: LocaleMessage,
    localeMessages: LocaleMessages
  ) {
    function getOtherLocaleMessages(locale: string) {
      const ignores = new Set([...ignoreLocales, locale])
      return localeMessages.locales
        .filter(locale => !ignores.has(locale))
        .map(locale => {
          return {
            locale,
            dictList: localeMessages.localeMessages.map(lm =>
              lm.getMessagesFromLocale(locale)
            )
          }
        })
    }
    type KeyStack =
      | {
          locale: null
          node?: N
          upper?: KeyStack
          otherLocaleMessages: null
        }
      | {
          locale: string
          node?: N
          upper?: KeyStack
          keyPath: (string | number)[]
          otherLocaleMessages: {
            locale: string
            dictList: I18nLocaleMessageDictionary[]
          }[]
        }
    let keyStack: KeyStack
    if (targetLocaleMessage.isResolvedLocaleByFileName()) {
      const locale = targetLocaleMessage.locales[0]
      keyStack = {
        locale,
        otherLocaleMessages: getOtherLocaleMessages(locale),
        keyPath: []
      }
    } else {
      keyStack = {
        locale: null,
        otherLocaleMessages: null
      }
    }

    // localeMessages.locales
    return {
      enterKey(key: string | number, node: N, needsVerify: boolean) {
        if (keyStack.locale == null) {
          const locale = key as string
          keyStack = {
            node,
            locale,
            otherLocaleMessages: getOtherLocaleMessages(locale),
            keyPath: [],
            upper: keyStack
          }
        } else {
          const keyPath = [...keyStack.keyPath, key]
          const nextOtherLocaleMessages: {
            locale: string
            dictList: I18nLocaleMessageDictionary[]
          }[] = []

          // verify and build next data
          const missingLocales: string[] = []
          for (const { locale, dictList } of keyStack.otherLocaleMessages) {
            const nextDictList: I18nLocaleMessageDictionary[] = []
            let exists = false
            for (const dict of dictList) {
              const nextDict = dict[key]
              if (nextDict != null) {
                exists = true
                if (typeof nextDict === 'object') {
                  nextDictList.push(nextDict)
                }
              }
            }
            if (!exists && needsVerify) {
              missingLocales.push(locale)
            }
            nextOtherLocaleMessages.push({ locale, dictList: nextDictList })
          }
          if (missingLocales.length) {
            reportMissing(keyPath, missingLocales, node)
          }
          keyStack = {
            node,
            locale: keyStack.locale,
            otherLocaleMessages: nextOtherLocaleMessages,
            keyPath,
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
    localeMessages: LocaleMessages
  ): RuleListener {
    const ctx = createVerifyContext(targetLocaleMessage, localeMessages)
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        const key =
          node.key.type === 'JSONLiteral' ? `${node.key.value}` : node.key.name

        ctx.enterKey(key, node.key, isLeafMessageNode(node.value))
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
        ctx.enterKey(key, node, isLeafMessageNode(node))
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
    localeMessages: LocaleMessages
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

    const ctx = createVerifyContext(targetLocaleMessage, localeMessages)

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

          ctx.enterKey(key, node.key, isLeafMessageNode(node.value))
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
        ctx.enterKey(key, node, isLeafMessageNode(node))
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
        return createVisitorForJson(targetLocaleMessage, localeMessages)
      },
      ctx => {
        const localeMessages = getLocaleMessages(context)
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        return createVisitorForYaml(targetLocaleMessage, localeMessages)
      }
    )
  } else if (
    sourceCode.parserServices.isJSON ||
    sourceCode.parserServices.isYAML
  ) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-missing-keys-in-other-locales`)
      return {}
    }

    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson(targetLocaleMessage, localeMessages)
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml(targetLocaleMessage, localeMessages)
    }
    return {}
  } else {
    debug(`ignore ${filename} in no-missing-keys-in-other-locales`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'layout',
    docs: {
      description: 'disallow missing locale message keys in other locales',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-missing-keys-in-other-locales.html',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          ignoreLocales: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
