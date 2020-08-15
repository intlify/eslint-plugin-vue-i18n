/**
 * @author Yosuke Ota
 */
import type { AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { LocaleMessage } from '../utils/locale-messages'
import type {
  I18nLocaleMessageDictionary,
  RuleContext,
  RuleListener,
  SourceCode
} from '../types'
import { joinPath } from '../utils/key-path'
const debug = debugBuilder('eslint-plugin-vue-i18n:no-duplicate-keys-in-locale')

interface DictData {
  dict: I18nLocaleMessageDictionary
  source: LocaleMessage
}

interface PathStack {
  otherDictionaries: DictData[]
  keyPath: string
  locale: string | null
  node?: JSONAST.JSONNode | YAMLAST.YAMLNode
  upper?: PathStack
}

function getMessageFilepath(fullPath: string) {
  if (fullPath.startsWith(process.cwd())) {
    return fullPath.replace(process.cwd(), '.')
  }
  return fullPath
}

function create(context: RuleContext): RuleListener {
  const filename = context.getFilename()
  const options = (context.options && context.options[0]) || {}
  const ignoreI18nBlock = Boolean(options.ignoreI18nBlock)

  /**
   * Create node visitor
   */
  function createVisitor<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    targetLocaleMessage: LocaleMessage,
    otherLocaleMessages: LocaleMessage[],
    {
      skipNode,
      resolveKey,
      resolveReportNode
    }: {
      skipNode: (node: N) => boolean
      resolveKey: (node: N) => string | number | null
      resolveReportNode: (node: N) => N
    }
  ) {
    let pathStack: PathStack
    if (targetLocaleMessage.localeKey === 'file') {
      const locale = targetLocaleMessage.locales[0]
      pathStack = {
        keyPath: '',
        locale,
        otherDictionaries: otherLocaleMessages.map(lm => {
          return {
            dict: lm.getMessagesFromLocale(locale),
            source: lm
          }
        })
      }
    } else {
      pathStack = {
        keyPath: '',
        locale: null,
        otherDictionaries: []
      }
    }
    const existsKeyNodes: {
      [locale: string]: { [key: string]: { node: N; reported: boolean }[] }
    } = {}
    const existsLocaleNodes: {
      [key: string]: { node: N; reported: boolean }[]
    } = {}
    return {
      enterNode(node: N) {
        if (skipNode(node)) {
          return
        }

        const key = resolveKey(node)
        if (key == null) {
          return
        }
        if (pathStack.locale == null) {
          // locale is resolved
          const locale = key as string
          verifyDupeKey(existsLocaleNodes, locale, node)
          pathStack = {
            upper: pathStack,
            node,
            keyPath: '',
            locale,
            otherDictionaries: otherLocaleMessages.map(lm => {
              return {
                dict: lm.getMessagesFromLocale(locale),
                source: lm
              }
            })
          }
          return
        }
        const keyOtherValues = pathStack.otherDictionaries
          .filter(dict => dict.dict[key] != null)
          .map(dict => {
            return {
              value: dict.dict[key],
              source: dict.source
            }
          })
        const keyPath = joinPath(pathStack.keyPath, key)
        const nextOtherDictionaries: DictData[] = []
        for (const value of keyOtherValues) {
          if (typeof value.value === 'string') {
            const reportNode = resolveReportNode(node)
            context.report({
              message: `duplicate key '${keyPath}' in '${
                pathStack.locale
              }'. "${getMessageFilepath(
                value.source.fullpath
              )}" has the same key`,
              loc: reportNode.loc
            })
          } else {
            nextOtherDictionaries.push({
              dict: value.value,
              source: value.source
            })
          }
        }

        verifyDupeKey(
          existsKeyNodes[pathStack.locale] ||
            (existsKeyNodes[pathStack.locale] = {}),
          keyPath,
          node
        )

        pathStack = {
          upper: pathStack,
          node,
          keyPath,
          locale: pathStack.locale,
          otherDictionaries: nextOtherDictionaries
        }
      },
      leaveNode(node: N) {
        if (pathStack.node === node) {
          pathStack = pathStack.upper!
        }
      }
    }

    function verifyDupeKey(
      exists: {
        [key: string]: { node: N; reported: boolean }[]
      },
      key: string,
      node: N
    ) {
      const keyNodes = exists[key] || (exists[key] = [])
      keyNodes.push({
        node,
        reported: false
      })
      if (keyNodes.length > 1) {
        for (const keyNode of keyNodes.filter(e => !e.reported)) {
          const reportNode = resolveReportNode(keyNode.node)
          context.report({
            message: `duplicate key '${key}'`,
            loc: reportNode.loc
          })
          keyNode.reported = true
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
    return createVisitor<JSONAST.JSONNode>(
      targetLocaleMessage,
      otherLocaleMessages,
      {
        skipNode(node) {
          if (
            node.type === 'Program' ||
            node.type === 'JSONExpressionStatement' ||
            node.type === 'JSONProperty'
          ) {
            return true
          }
          const parent = node.parent!
          if (parent.type === 'JSONProperty' && parent.key === node) {
            return true
          }
          return false
        },
        resolveKey(node) {
          const parent = node.parent!
          if (parent.type === 'JSONProperty') {
            return parent.key.type === 'JSONLiteral'
              ? `${parent.key.value}`
              : parent.key.name
          } else if (parent.type === 'JSONArrayExpression') {
            return parent.elements.indexOf(node as never)
          }
          return null
        },

        resolveReportNode(node) {
          const parent = node.parent!
          return parent.type === 'JSONProperty' ? parent.key : node
        }
      }
    )
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(
    sourceCode: SourceCode,
    targetLocaleMessage: LocaleMessage,
    otherLocaleMessages: LocaleMessage[]
  ) {
    const yamlKeyNodes = new Set()
    return createVisitor<YAMLAST.YAMLNode>(
      targetLocaleMessage,
      otherLocaleMessages,
      {
        skipNode(node) {
          if (
            node.type === 'Program' ||
            node.type === 'YAMLDocument' ||
            node.type === 'YAMLDirective' ||
            node.type === 'YAMLAnchor' ||
            node.type === 'YAMLTag'
          ) {
            return true
          }

          if (yamlKeyNodes.has(node)) {
            // within key node
            return true
          }
          const parent = node.parent
          if (yamlKeyNodes.has(parent)) {
            // within key node
            yamlKeyNodes.add(node)
            return true
          }
          if (node.type === 'YAMLPair') {
            yamlKeyNodes.add(node.key)
            return true
          }
          return false
        },
        resolveKey(node) {
          const parent = node.parent!
          if (parent.type === 'YAMLPair' && parent.key) {
            const key =
              parent.key.type !== 'YAMLScalar'
                ? sourceCode.getText(parent.key)
                : parent.key.value
            return typeof key === 'boolean' || key === null ? String(key) : key
          } else if (parent.type === 'YAMLSequence') {
            return parent.entries.indexOf(node as never)
          }

          return null
        },
        resolveReportNode(node) {
          const parent = node.parent!
          return parent.type === 'YAMLPair' ? parent.key || parent : node
        }
      }
    )
  }

  if (extname(filename) === '.vue') {
    return {
      Program() {
        const documentFragment =
          context.parserServices.getDocumentFragment &&
          context.parserServices.getDocumentFragment()
        /** @type {VElement[]} */
        const i18nBlocks =
          (documentFragment &&
            documentFragment.children.filter(
              (node): node is VAST.VElement =>
                node.type === 'VElement' && node.name === 'i18n'
            )) ||
          []
        if (!i18nBlocks.length) {
          return
        }
        const localeMessages = getLocaleMessages(context)

        for (const block of i18nBlocks) {
          if (
            block.startTag.attributes.some(
              attr => !attr.directive && attr.key.name === 'src'
            )
          ) {
            continue
          }

          const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
            block
          )
          if (!targetLocaleMessage) {
            continue
          }
          const sourceCode = targetLocaleMessage.getSourceCode()
          if (!sourceCode) {
            continue
          }

          const otherLocaleMessages: LocaleMessage[] = ignoreI18nBlock
            ? []
            : localeMessages.localeMessages.filter(
                lm => lm !== targetLocaleMessage
              )
          const parserLang = targetLocaleMessage.getParserLang()

          let visitor
          if (parserLang === 'json') {
            visitor = createVisitorForJson(
              sourceCode,
              targetLocaleMessage,
              otherLocaleMessages
            )
          } else if (parserLang === 'yaml') {
            visitor = createVisitorForYaml(
              sourceCode,
              targetLocaleMessage,
              otherLocaleMessages
            )
          }

          if (visitor == null) {
            return
          }

          targetLocaleMessage.traverseNodes({
            enterNode: visitor.enterNode,
            leaveNode: visitor.leaveNode
          })
        }
      }
    }
  } else if (context.parserServices.isJSON || context.parserServices.isYAML) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-duplicate-keys-in-locale`)
      return {}
    }

    const sourceCode = context.getSourceCode()
    const otherLocaleMessages: LocaleMessage[] = localeMessages.localeMessages.filter(
      lm => lm !== targetLocaleMessage
    )

    if (context.parserServices.isJSON) {
      const { enterNode, leaveNode } = createVisitorForJson(
        sourceCode,
        targetLocaleMessage,
        otherLocaleMessages
      )

      return {
        '[type=/^JSON/]': enterNode,
        '[type=/^JSON/]:exit': leaveNode
      }
    } else if (context.parserServices.isYAML) {
      const { enterNode, leaveNode } = createVisitorForYaml(
        sourceCode,
        targetLocaleMessage,
        otherLocaleMessages
      )

      return {
        '[type=/^YAML/]': enterNode,
        '[type=/^YAML/]:exit': leaveNode
      }
    }
    return {}
  } else {
    debug(`ignore ${filename} in no-duplicate-keys-in-locale`)
    return {}
  }
}

export = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow duplicate localization keys within the same locale',
      category: 'Best Practices',
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
}
