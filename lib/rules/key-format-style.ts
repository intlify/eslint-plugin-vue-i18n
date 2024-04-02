/**
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import { getCasingChecker } from '../utils/casing'
import type { LocaleMessage } from '../utils/locale-messages'
import { createRule } from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder('eslint-plugin-vue-i18n:key-format-style')

const allowedCaseOptions = [
  'camelCase',
  'kebab-case',
  'lowercase',
  'snake_case',
  'SCREAMING_SNAKE_CASE'
] as const
type CaseOption = (typeof allowedCaseOptions)[number]

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
  const expectCasing: CaseOption = context.options[0] ?? 'camelCase'
  const checker = getCasingChecker(expectCasing)
  const allowArray: boolean = context.options[1]?.allowArray
  const splitByDotsOption: boolean = context.options[1]?.splitByDots

  function reportUnknown(reportNode: YAMLAST.YAMLNode) {
    context.report({
      message: `Unexpected object key. Use ${expectCasing} string key instead`,
      loc: reportNode.loc
    })
  }
  function verifyKeyForString(
    key: string,
    reportNode:
      | JSONAST.JSONProperty['key']
      | NonNullable<YAMLAST.YAMLPair['key']>
  ): void {
    for (const target of splitByDotsOption && key.includes('.')
      ? splitByDots(key, reportNode)
      : [{ key, loc: reportNode.loc }]) {
      if (!checker(target.key)) {
        context.report({
          message: `"{{key}}" is not {{expectCasing}}`,
          loc: target.loc,
          data: {
            key: target.key,
            expectCasing
          }
        })
      }
    }
  }
  function verifyKeyForNumber(
    key: number,
    reportNode:
      | NonNullable<JSONAST.JSONArrayExpression['elements'][number]>
      | NonNullable<YAMLAST.YAMLSequence['entries'][number]>
  ): void {
    if (!allowArray) {
      context.report({
        message: `Unexpected array element`,
        loc: reportNode.loc
      })
    }
  }

  function splitByDots(
    key: string,
    reportNode:
      | JSONAST.JSONProperty['key']
      | NonNullable<YAMLAST.YAMLPair['key']>
  ) {
    const result: {
      key: string
      loc: JSONAST.SourceLocation
    }[] = []
    let startIndex = 0
    let index
    while ((index = key.indexOf('.', startIndex)) >= 0) {
      const getLoc = buildGetLocation(startIndex, index)
      result.push({
        key: key.slice(startIndex, index),
        get loc() {
          return getLoc()
        }
      })

      startIndex = index + 1
    }

    const getLoc = buildGetLocation(startIndex, key.length)
    result.push({
      key: key.slice(startIndex, index),
      get loc() {
        return getLoc()
      }
    })

    return result

    function buildGetLocation(start: number, end: number) {
      const offset =
        reportNode.type === 'JSONLiteral' ||
        (reportNode.type === 'YAMLScalar' &&
          (reportNode.style === 'double-quoted' ||
            reportNode.style === 'single-quoted'))
          ? reportNode.range[0] + 1
          : reportNode.range[0]
      let cachedLoc: JSONAST.SourceLocation | undefined
      return () => {
        if (cachedLoc) {
          return cachedLoc
        }
        return (cachedLoc = {
          start: sourceCode.getLocFromIndex(offset + start),
          end: sourceCode.getLocFromIndex(offset + end)
        })
      }
    }
  }
  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(
    targetLocaleMessage: LocaleMessage
  ): RuleListener {
    type KeyStack = {
      inLocale: boolean
      node?: JSONAST.JSONNode
      upper?: KeyStack
    }
    let keyStack: KeyStack = {
      inLocale: targetLocaleMessage.isResolvedLocaleByFileName()
    }
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        const { inLocale } = keyStack
        keyStack = {
          node,
          inLocale: true,
          upper: keyStack
        }
        if (!inLocale) {
          return
        }

        const key =
          node.key.type === 'JSONLiteral' ? `${node.key.value}` : node.key.name

        verifyKeyForString(key, node.key)
      },
      'JSONProperty:exit'() {
        keyStack = keyStack.upper!
      },
      'JSONArrayExpression > *'(
        node: JSONAST.JSONArrayExpression['elements'][number] & {
          parent: JSONAST.JSONArrayExpression
        }
      ) {
        const key = node.parent.elements.indexOf(node)
        verifyKeyForNumber(key, node)
      }
    }
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(
    targetLocaleMessage: LocaleMessage
  ): RuleListener {
    const yamlKeyNodes = new Set<YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta>()

    type KeyStack = {
      inLocale: boolean
      node?: YAMLAST.YAMLNode
      upper?: KeyStack
    }
    let keyStack: KeyStack = {
      inLocale: targetLocaleMessage.isResolvedLocaleByFileName()
    }
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
        const { inLocale } = keyStack
        keyStack = {
          node,
          inLocale: true,
          upper: keyStack
        }
        if (!inLocale) {
          return
        }
        if (node.key != null) {
          if (withinKey(node)) {
            return
          }
          yamlKeyNodes.add(node.key)
        }

        if (node.key == null) {
          reportUnknown(node)
        } else if (node.key.type === 'YAMLScalar') {
          const keyValue = node.key.value
          const key = typeof keyValue === 'string' ? keyValue : String(keyValue)
          verifyKeyForString(key, node.key)
        } else {
          reportUnknown(node)
        }
      },
      'YAMLPair:exit'() {
        keyStack = keyStack.upper!
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
        verifyKeyForNumber(key, node)
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
        return createVisitorForJson(targetLocaleMessage)
      },
      ctx => {
        const localeMessages = getLocaleMessages(context)
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        return createVisitorForYaml(targetLocaleMessage)
      }
    )
  } else if (
    sourceCode.parserServices.isJSON ||
    sourceCode.parserServices.isYAML
  ) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in key-format-style`)
      return {}
    }

    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson(targetLocaleMessage)
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml(targetLocaleMessage)
    }
    return {}
  } else {
    debug(`ignore ${filename} in key-format-style`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'layout',
    docs: {
      description: 'enforce specific casing for localization keys',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/key-format-style.html',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        enum: [...allowedCaseOptions]
      },
      {
        type: 'object',
        properties: {
          allowArray: {
            type: 'boolean'
          },
          splitByDots: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
