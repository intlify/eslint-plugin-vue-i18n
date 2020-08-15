/**
 * @author Yosuke Ota
 */
import type { AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import { getCasingChecker } from '../utils/casing'
import { LocaleMessage } from '../utils/locale-messages'
const debug = debugBuilder('eslint-plugin-vue-i18n:key-format-style')

const allowedCaseOptions = ['camelCase', 'kebab-case', 'snake_case'] as const
type CaseOption = typeof allowedCaseOptions[number]
const unknownKey = Symbol('unknown key')
type UnknownKey = typeof unknownKey

function create(context: RuleContext): RuleListener {
  const filename = context.getFilename()
  const expectCasing: CaseOption = context.options[0] ?? 'camelCase'
  const checker = getCasingChecker(expectCasing)
  const allowArray: boolean = context.options[1]?.allowArray

  /**
   * Create node visitor
   */
  function createVisitor<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    targetLocaleMessage: LocaleMessage,
    {
      skipNode,
      resolveKey,
      resolveReportNode
    }: {
      skipNode: (node: N) => boolean
      resolveKey: (node: N) => string | number | UnknownKey | null
      resolveReportNode: (node: N) => N
    }
  ) {
    type KeyStack = {
      inLocale: boolean
      node?: N
      upper?: KeyStack
    }
    let keyStack: KeyStack = {
      inLocale: targetLocaleMessage.localeKey === 'file'
    }
    return {
      enterNode(node: N) {
        if (skipNode(node)) {
          return
        }
        const key = resolveKey(node)
        if (key == null) {
          return
        }
        const { inLocale } = keyStack
        keyStack = {
          node,
          inLocale: true,
          upper: keyStack
        }
        if (!inLocale) {
          return
        }
        if (key === unknownKey) {
          context.report({
            message: `Unexpected object key. Use ${expectCasing} string key instead`,
            loc: resolveReportNode(node).loc
          })
        } else if (typeof key === 'number') {
          if (!allowArray) {
            context.report({
              message: `Unexpected array element`,
              loc: resolveReportNode(node).loc
            })
          }
        } else {
          if (!checker(key)) {
            context.report({
              message: `"${key}" is not ${expectCasing}`,
              loc: resolveReportNode(node).loc
            })
          }
        }
      },
      leaveNode(node: N) {
        if (keyStack.node === node) {
          keyStack = keyStack.upper!
        }
      }
    }
  }
  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(targetLocaleMessage: LocaleMessage) {
    return createVisitor<JSONAST.JSONNode>(targetLocaleMessage, {
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
    })
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(targetLocaleMessage: LocaleMessage) {
    const yamlKeyNodes = new Set()
    return createVisitor<YAMLAST.YAMLNode>(targetLocaleMessage, {
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
        if (parent.type === 'YAMLPair') {
          if (parent.key == null) {
            return unknownKey
          }
          if (parent.key.type === 'YAMLScalar') {
            const key = parent.key.value
            return typeof key === 'string' ? key : String(key)
          }
          return unknownKey
        } else if (parent.type === 'YAMLSequence') {
          return parent.entries.indexOf(node as never)
        }

        return null
      },
      resolveReportNode(node) {
        const parent = node.parent!
        return parent.type === 'YAMLPair' ? parent.key || parent : node
      }
    })
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
          const parserLang = targetLocaleMessage.getParserLang()

          let visitor
          if (parserLang === 'json') {
            visitor = createVisitorForJson(targetLocaleMessage)
          } else if (parserLang === 'yaml') {
            visitor = createVisitorForYaml(targetLocaleMessage)
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
      debug(`ignore ${filename} in key-format-style`)
      return {}
    }

    if (context.parserServices.isJSON) {
      const { enterNode, leaveNode } = createVisitorForJson(targetLocaleMessage)

      return {
        '[type=/^JSON/]': enterNode,
        '[type=/^JSON/]:exit': leaveNode
      }
    } else if (context.parserServices.isYAML) {
      const { enterNode, leaveNode } = createVisitorForYaml(targetLocaleMessage)

      return {
        '[type=/^YAML/]': enterNode,
        '[type=/^YAML/]:exit': leaveNode
      }
    }
    return {}
  } else {
    debug(`ignore ${filename} in key-format-style`)
    return {}
  }
}

export = {
  meta: {
    type: 'layout',
    docs: {
      description: 'enforce specific casing for localization keys',
      category: 'Best Practices',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        enum: allowedCaseOptions
      },
      {
        type: 'object',
        properties: {
          allowArray: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
}
