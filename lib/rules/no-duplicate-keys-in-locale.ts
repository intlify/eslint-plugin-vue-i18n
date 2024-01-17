/**
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { LocaleMessage } from '../utils/locale-messages'
import type {
  I18nLocaleMessageDictionary,
  RuleContext,
  RuleListener,
  SourceCode
} from '../types'
import { joinPath } from '../utils/key-path'
import { getCwd } from '../utils/get-cwd'
import { createRule } from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder('eslint-plugin-vue-i18n:no-duplicate-keys-in-locale')

interface DictData {
  dict: I18nLocaleMessageDictionary
  source: LocaleMessage
}

interface PathStack {
  otherDictionaries: DictData[]
  keyPath: (string | number)[]
  locale: string | null
  node?: JSONAST.JSONNode | YAMLAST.YAMLNode
  upper?: PathStack
}

function getMessageFilepath(fullPath: string, context: RuleContext) {
  const cwd = getCwd(context)
  if (fullPath.startsWith(cwd)) {
    return fullPath.replace(`${cwd}/`, './')
  }
  return fullPath
}

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
  const options = (context.options && context.options[0]) || {}
  const ignoreI18nBlock = Boolean(options.ignoreI18nBlock)

  function createInitPathStack(
    targetLocaleMessage: LocaleMessage,
    otherLocaleMessages: LocaleMessage[]
  ): PathStack {
    if (targetLocaleMessage.isResolvedLocaleByFileName()) {
      const locale = targetLocaleMessage.locales[0]
      return createInitLocalePathStack(locale, otherLocaleMessages)
    } else {
      return {
        keyPath: [],
        locale: null,
        otherDictionaries: []
      }
    }
  }
  function createInitLocalePathStack(
    locale: string,
    otherLocaleMessages: LocaleMessage[]
  ): PathStack {
    return {
      keyPath: [],
      locale,
      otherDictionaries: otherLocaleMessages.map(lm => {
        return {
          dict: lm.getMessagesFromLocale(locale),
          source: lm
        }
      })
    }
  }

  function createVerifyContext<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    targetLocaleMessage: LocaleMessage,
    otherLocaleMessages: LocaleMessage[]
  ) {
    let pathStack = createInitPathStack(
      targetLocaleMessage,
      otherLocaleMessages
    )
    const existsKeyNodes: {
      [locale: string]: { [key: string]: N[] }
    } = {}
    const existsLocaleNodes: {
      [key: string]: N[]
    } = {}

    function pushKey(
      exists: {
        [key: string]: (JSONAST.JSONNode | YAMLAST.YAMLNode)[]
      },
      key: string,
      reportNode: JSONAST.JSONNode | YAMLAST.YAMLNode
    ) {
      const keyNodes = exists[key] || (exists[key] = [])
      keyNodes.push(reportNode)
    }
    return {
      enterKey(key: string | number, reportNode: N) {
        if (pathStack.locale == null) {
          // locale is resolved
          const locale = key as string
          pushKey(existsLocaleNodes, locale, reportNode)
          pathStack = {
            upper: pathStack,
            node: reportNode,
            ...createInitLocalePathStack(locale, otherLocaleMessages)
          }
          return
        }
        const keyOtherValues = pathStack.otherDictionaries.map(dict => {
          return {
            value: dict.dict[key],
            source: dict.source
          }
        })
        const keyPath = [...pathStack.keyPath, key]
        const keyPathStr = joinPath(...keyPath)
        const nextOtherDictionaries: DictData[] = []
        const reportFiles = []
        for (const value of keyOtherValues) {
          if (value.value == null) {
            continue
          }
          if (typeof value.value !== 'object') {
            reportFiles.push(
              `"${getMessageFilepath(value.source.fullpath, context)}"`
            )
          } else {
            nextOtherDictionaries.push({
              dict: value.value,
              source: value.source
            })
          }
        }
        if (reportFiles.length) {
          reportFiles.sort()
          const last = reportFiles.pop()
          context.report({
            message: `duplicate key '${keyPathStr}' in '${pathStack.locale}'. ${
              reportFiles.length === 0
                ? last
                : `${reportFiles.join(', ')}, and ${last}`
            } has the same key`,
            loc: reportNode.loc
          })
        }

        pushKey(
          existsKeyNodes[pathStack.locale] ||
            (existsKeyNodes[pathStack.locale] = {}),
          keyPathStr,
          reportNode
        )

        pathStack = {
          upper: pathStack,
          node: reportNode,
          keyPath,
          locale: pathStack.locale,
          otherDictionaries: nextOtherDictionaries
        }
      },
      leaveKey(node: N | null) {
        if (pathStack.node === node) {
          pathStack = pathStack.upper!
        }
      },
      reports() {
        for (const localeNodes of [
          existsLocaleNodes,
          ...Object.values(existsKeyNodes)
        ]) {
          for (const key of Object.keys(localeNodes)) {
            const keyNodes = localeNodes[key]
            if (keyNodes.length > 1) {
              for (const keyNode of keyNodes) {
                context.report({
                  message: `duplicate key '${key}'`,
                  loc: keyNode.loc
                })
              }
            }
          }
        }
      }
    }
  }

  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(
    _sourceCode: SourceCode,
    targetLocaleMessage: LocaleMessage,
    otherLocaleMessages: LocaleMessage[]
  ) {
    const verifyContext = createVerifyContext(
      targetLocaleMessage,
      otherLocaleMessages
    )
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        const key =
          node.key.type === 'JSONLiteral' ? `${node.key.value}` : node.key.name

        verifyContext.enterKey(key, node.key)
      },
      'JSONProperty:exit'(node: JSONAST.JSONProperty) {
        verifyContext.leaveKey(node.key)
      },
      'JSONArrayExpression > *'(
        node: JSONAST.JSONArrayExpression['elements'][number] & {
          parent: JSONAST.JSONArrayExpression
        }
      ) {
        const key = node.parent.elements.indexOf(node)
        verifyContext.enterKey(key, node)
      },
      'JSONArrayExpression > *:exit'(
        node: JSONAST.JSONArrayExpression['elements'][number]
      ) {
        verifyContext.leaveKey(node!)
      },
      'Program:exit'() {
        verifyContext.reports()
      }
    }
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(
    sourceCode: SourceCode,
    targetLocaleMessage: LocaleMessage,
    otherLocaleMessages: LocaleMessage[]
  ) {
    const verifyContext = createVerifyContext(
      targetLocaleMessage,
      otherLocaleMessages
    )
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
    return {
      YAMLPair(node: YAMLAST.YAMLPair) {
        if (node.key != null) {
          if (withinKey(node)) {
            return
          }
          yamlKeyNodes.add(node.key)
        } else {
          return
        }

        const keyValue =
          node.key.type !== 'YAMLScalar'
            ? sourceCode.getText(node.key)
            : node.key.value
        const key =
          typeof keyValue === 'boolean' || keyValue === null
            ? String(keyValue)
            : keyValue

        verifyContext.enterKey(key, node.key)
      },
      'YAMLPair:exit'(node: YAMLAST.YAMLPair) {
        verifyContext.leaveKey(node.key)
      },
      'YAMLSequence > *'(
        node: YAMLAST.YAMLSequence['entries'][number] & {
          parent: YAMLAST.YAMLSequence
        }
      ) {
        const key = node.parent.entries.indexOf(node)
        verifyContext.enterKey(key, node)
      },
      'YAMLSequence > *:exit'(node: YAMLAST.YAMLSequence['entries'][number]) {
        verifyContext.leaveKey(node!)
      },
      'Program:exit'() {
        verifyContext.reports()
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
        const otherLocaleMessages: LocaleMessage[] = ignoreI18nBlock
          ? []
          : localeMessages.localeMessages.filter(
              lm => lm !== targetLocaleMessage
            )
        return createVisitorForJson(
          getSourceCode(ctx),
          targetLocaleMessage,
          otherLocaleMessages
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
        const otherLocaleMessages: LocaleMessage[] = ignoreI18nBlock
          ? []
          : localeMessages.localeMessages.filter(
              lm => lm !== targetLocaleMessage
            )
        return createVisitorForYaml(
          getSourceCode(ctx),
          targetLocaleMessage,
          otherLocaleMessages
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
      debug(`ignore ${filename} in no-duplicate-keys-in-locale`)
      return {}
    }

    const otherLocaleMessages: LocaleMessage[] =
      localeMessages.localeMessages.filter(lm => lm !== targetLocaleMessage)

    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson(
        sourceCode,
        targetLocaleMessage,
        otherLocaleMessages
      )
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml(
        sourceCode,
        targetLocaleMessage,
        otherLocaleMessages
      )
    }
    return {}
  } else {
    debug(`ignore ${filename} in no-duplicate-keys-in-locale`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow duplicate localization keys within the same locale',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-duplicate-keys-in-locale.html',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          ignoreI18nBlock: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
