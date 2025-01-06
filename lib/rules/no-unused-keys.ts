/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { collectKeysFromAST, usedKeysCache } from '../utils/collect-keys'
import { collectLinkedKeys } from '../utils/collect-linked-keys'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { LocaleMessage } from '../utils/locale-messages'
import type {
  I18nLocaleMessageDictionary,
  RuleContext,
  RuleListener,
  RuleFixer,
  Fix,
  SourceCode,
  Range,
  CustomBlockVisitorFactory
} from '../types'
import { joinPath, parsePath } from '../utils/key-path'
import { getCwd } from '../utils/get-cwd'
import { createRule } from '../utils/rule'
import { toRegExp } from '../utils/regexp'
import { getFilename, getSourceCode } from '../utils/compat'
const debug = debugBuilder('eslint-plugin-vue-i18n:no-unused-keys')

type UsedKeys = {
  [key: string]: string | UsedKeys
  [key: number]: string | UsedKeys
}
interface PathStack {
  usedKeys: UsedKeys
  keyPath: (string | number)[]
  node?: JSONAST.JSONNode | YAMLAST.YAMLNode
  upper?: PathStack
}

function isDef<V>(v: V | null | undefined): v is V {
  return v != null
}

/**
 * @param {LocaleMessage} targetLocaleMessage
 * @param {object} jsonValue
 * @param {string[]} usedkeys
 * @returns {UsedKeys}
 */
function getUsedKeysMap(
  targetLocaleMessage: LocaleMessage,
  values: I18nLocaleMessageDictionary,
  usedkeys: string[],
  context: RuleContext
): UsedKeys {
  /** @type {UsedKeys} */
  const usedKeysMap: UsedKeys = {}

  for (const key of [...usedkeys, ...collectLinkedKeys(values, context)]) {
    usedKeysMap[key] = {} // Set original key.
    const paths = parsePath(key)
    let map = usedKeysMap
    while (paths.length) {
      const path = paths.shift()!
      map = map[path] = (map[path] as UsedKeys) || {}
    }
  }

  if (targetLocaleMessage.localeKey === 'key') {
    return targetLocaleMessage.locales.reduce((keys, locale) => {
      keys[locale] = usedKeysMap
      return keys
    }, {} as UsedKeys)
  }
  return usedKeysMap
}

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const options = (context.options && context.options[0]) || {}
  const enableFix = options.enableFix
  const ignores = ((options.ignores || []) as string[]).map(toRegExp)

  function createVerifyContext<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    usedKeys: UsedKeys,
    {
      buildFixer,
      buildAllFixer
    }: {
      buildFixer: (
        node: N
      ) =>
        | null
        | ((fixer: RuleFixer) => null | Fix | Fix[] | IterableIterator<Fix>)
      buildAllFixer: (
        node: N[]
      ) => (fixer: RuleFixer) => null | Fix | Fix[] | IterableIterator<Fix>
    }
  ) {
    /** @type {PathStack} */
    let pathStack: PathStack = { usedKeys, keyPath: [] }
    const reports: { node: N; keyPath: (string | number)[] }[] = []
    return {
      enterKey(key: string | number, reportNode: N, ignoreReport: boolean) {
        const keyPath = [...pathStack.keyPath, key]
        pathStack = {
          upper: pathStack,
          node: reportNode,
          usedKeys:
            (pathStack.usedKeys && (pathStack.usedKeys[key] as UsedKeys)) ||
            false,
          keyPath
        }
        const isUnused = !pathStack.usedKeys
        if (isUnused) {
          if (!ignoreReport)
            reports.push({
              node: reportNode,
              keyPath
            })
        }
      },
      /**
       * @param {JSONNode | YAMLNode} node
       */
      leaveKey(reportNode: N | null) {
        if (pathStack.node === reportNode) {
          pathStack = pathStack.upper!
        }
      },
      reports() {
        for (const { node, keyPath } of reports) {
          const keyPathStr = joinPath(...keyPath)
          if (ignores.some(reg => reg.test(keyPathStr))) {
            continue
          }
          const fix = buildFixer(node)
          context.report({
            message: `unused '${keyPathStr}' key`,
            loc: node.loc,
            fix: enableFix ? fix : null,
            suggest: [
              {
                desc: `Remove the '${keyPathStr}' key.`,
                fix
              },
              reports.length > 1
                ? {
                    desc: 'Remove all unused keys.',
                    fix: buildAllFixer(reports.map(({ node: n }) => n))
                  }
                : null
            ].filter(isDef)
          })
        }
      }
    }
  }
  /**
   * Create node visitor for JSON
   * @param {SourceCode} sourceCode
   * @param {UsedKeys} usedKeys
   */
  function createVisitorForJson(sourceCode: SourceCode, usedKeys: UsedKeys) {
    const verifyContext = createVerifyContext(usedKeys, {
      buildFixer(node: JSONAST.JSONNode) {
        return fixer => fixer.removeRange(fixRemoveRange(node))
      },
      buildAllFixer(nodes: JSONAST.JSONNode[]) {
        return function* (fixer) {
          yield* fixAllRemoveKeys(fixer, nodes)
        }
      }
    })
    function isIgnore(node: JSONAST.JSONExpression) {
      return (
        node.type === 'JSONArrayExpression' ||
        node.type === 'JSONObjectExpression'
      )
    }
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        const key =
          node.key.type === 'JSONLiteral' ? `${node.key.value}` : node.key.name

        verifyContext.enterKey(key, node.key, isIgnore(node.value))
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
        verifyContext.enterKey(key, node, isIgnore(node))
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

    function* fixAllRemoveKeys(fixer: RuleFixer, nodes: JSONAST.JSONNode[]) {
      const removed = new Set<JSONAST.JSONNode>()
      let preLast = 0
      for (const node of nodes) {
        const range = fixRemoveRange(node, removed)
        const start = Math.max(preLast, range[0])
        yield fixer.removeRange([start, range[1]])
        preLast = range[1]
      }
    }

    function fixRemoveRange(
      node: JSONAST.JSONNode,
      removedNodes: Set<JSONAST.JSONNode> = new Set()
    ): Range {
      const parent = node.parent!
      let removeNode
      let isFirst = false
      let isLast = false
      if (parent.type === 'JSONProperty') {
        removeNode = parent
        const properties = parent.parent.properties.filter(
          p => !removedNodes.has(p)
        )
        const index = properties.indexOf(parent)
        isFirst = index === 0
        isLast = index === properties.length - 1
      } else {
        removeNode = node
        if (parent.type === 'JSONArrayExpression') {
          const elements = parent.elements.filter(
            e => e == null || !removedNodes.has(e)
          )
          const index = elements.indexOf(node as never)
          isFirst = index === 0
          isLast = index === elements.length - 1
        }
      }
      removedNodes.add(removeNode)
      const range: Range = [...removeNode.range]

      if (isLast || isFirst) {
        const after = sourceCode.getTokenAfter(removeNode)
        if (after && after.type === 'Punctuator' && after.value === ',') {
          range[1] = after.range[1]
        }
      }
      const before = sourceCode.getTokenBefore(removeNode)
      if (before) {
        if (before.type === 'Punctuator' && before.value === ',') {
          range[0] = before.range[0]
        } else {
          range[0] = before.range[1]
        }
      }
      return range
    }
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(sourceCode: SourceCode, usedKeys: UsedKeys) {
    const verifyContext = createVerifyContext(usedKeys, {
      buildFixer(node: YAMLAST.YAMLNode) {
        return function* (fixer) {
          const parentToCheck = node.parent!
          const removeNode =
            parentToCheck.type === 'YAMLPair' ? parentToCheck : node
          const parent = removeNode.parent!
          if (parent.type === 'YAMLMapping' || parent.type === 'YAMLSequence') {
            if (parent.style === 'flow') {
              // flow style
              yield fixForFlow(fixer, removeNode)
            } else {
              // block style
              yield* fixForBlock(fixer, removeNode)
            }
          }
        }
      },
      buildAllFixer(nodes: YAMLAST.YAMLNode[]) {
        return function* (fixer) {
          const removed = new Set()
          /** @type {YAMLNode[]} */
          const removeNodes = nodes.map(node => {
            const parentToCheck = node.parent!
            return parentToCheck.type === 'YAMLPair' ? parentToCheck : node
          })
          for (const removeNode of removeNodes) {
            if (removed.has(removeNode)) {
              continue
            }
            const parent = removeNode.parent!
            if (parent.type === 'YAMLMapping') {
              if (parent.pairs.every(p => removeNodes.includes(p))) {
                // all remove
                const before = sourceCode.getTokenBefore(parent)
                if (before) {
                  yield fixer.replaceTextRange(
                    [before.range[1], parent.range[1]],
                    ' {}'
                  )
                } else {
                  yield fixer.replaceText(parent, '{}')
                }
                parent.pairs.forEach(n => removed.add(n))
                continue
              }
              removed.add(removeNode)
              if (parent.style === 'flow') {
                // flow style
                // | { foo: bar }
                yield fixForFlow(fixer, removeNode)
              } else {
                // block style
                // | foo: bar
                yield* fixForBlock(fixer, removeNode)
              }
            } else if (parent.type === 'YAMLSequence') {
              if (parent.entries.every(p => p && removeNodes.includes(p))) {
                // all remove
                const before = sourceCode.getTokenBefore(parent)
                if (before) {
                  yield fixer.replaceTextRange(
                    [before.range[1], parent.range[1]],
                    ' []'
                  )
                } else {
                  yield fixer.replaceText(parent, '[]')
                }
                parent.entries.forEach(n => removed.add(n))
                continue
              }
              removed.add(removeNode)
              if (parent.style === 'flow') {
                // flow style
                // | [ foo ]
                yield fixForFlow(fixer, removeNode)
              } else {
                // block style
                // | - foo
                // | - bar
                yield* fixForBlock(fixer, removeNode)
              }
            }
          }
        }
      }
    })
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
    function isIgnore(node: YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta | null) {
      return Boolean(
        node && (node.type === 'YAMLMapping' || node.type === 'YAMLSequence')
      )
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

        verifyContext.enterKey(key, node.key, isIgnore(node.value))
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
        verifyContext.enterKey(key, node, isIgnore(node))
      },
      'YAMLSequence > *:exit'(node: YAMLAST.YAMLSequence['entries'][number]) {
        verifyContext.leaveKey(node!)
      },
      'Program:exit'() {
        verifyContext.reports()
      }
    }
    /**
     * @param {RuleFixer} fixer
     * @param {YAMLNode} removeNode
     */
    function* fixForBlock(fixer: RuleFixer, removeNode: YAMLAST.YAMLNode) {
      const parent = removeNode.parent!
      if (parent.type === 'YAMLMapping') {
        if (parent.pairs.length === 1) {
          const before = sourceCode.getTokenBefore(parent)
          if (before) {
            yield fixer.replaceTextRange(
              [before.range[1], parent.range[1]],
              ' {}'
            )
          } else {
            yield fixer.replaceText(parent, '{}')
          }
        } else {
          const before = sourceCode.getTokenBefore(removeNode)
          yield fixer.removeRange([
            before ? before.range[1] : removeNode.range[0],
            removeNode.range[1]
          ])
        }
      } else if (parent.type === 'YAMLSequence') {
        if (parent.entries.length === 1) {
          const before = sourceCode.getTokenBefore(parent)
          if (before) {
            yield fixer.replaceTextRange(
              [before.range[1], parent.range[1]],
              ' []'
            )
          } else {
            yield fixer.replaceText(parent, '[]')
          }
        } else {
          const hyphen = sourceCode.getTokenBefore(removeNode)
          const before = sourceCode.getTokenBefore(hyphen || removeNode)
          yield fixer.removeRange([
            before
              ? before.range[1]
              : hyphen
                ? hyphen.range[0]
                : removeNode.range[0],
            removeNode.range[1]
          ])
        }
      }
    }
    /**
     * @param {RuleFixer} fixer
     * @param {YAMLNode} removeNode
     */
    function fixForFlow(fixer: RuleFixer, removeNode: YAMLAST.YAMLNode) {
      const parent = removeNode.parent!
      let isFirst = false
      let isLast = false
      if (parent.type === 'YAMLMapping') {
        const index = parent.pairs.indexOf(removeNode as never)
        isFirst = index === 0
        isLast = index === parent.pairs.length - 1
      } else if (parent.type === 'YAMLSequence') {
        const index = parent.entries.indexOf(removeNode as never)
        isFirst = index === 0
        isLast = index === parent.entries.length - 1
      }
      const range: Range = [...removeNode.range]

      if (isLast || isFirst) {
        const after = sourceCode.getTokenAfter(removeNode)
        if (after && after.type === 'Punctuator' && after.value === ',') {
          range[1] = after.range[1]
        }
      }
      const before = sourceCode.getTokenBefore(removeNode)
      if (before) {
        if (before.type === 'Punctuator' && before.value === ',') {
          range[0] = before.range[0]
        } else {
          range[0] = before.range[1]
        }
      }
      return fixer.removeRange(range)
    }
  }

  const sourceCode = getSourceCode(context)
  if (extname(filename) === '.vue') {
    const createCustomBlockRule = (
      createVisitor: (
        sourceCode: SourceCode,
        usedKeys: UsedKeys
      ) => RuleListener
    ): CustomBlockVisitorFactory => {
      return ctx => {
        const localeMessages = getLocaleMessages(context)
        const usedLocaleMessageKeys = collectKeysFromAST(
          sourceCode.ast as VAST.ESLintProgram,
          sourceCode.visitorKeys
        )
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        const usedKeys = getUsedKeysMap(
          targetLocaleMessage,
          targetLocaleMessage.messages,
          usedLocaleMessageKeys,
          context
        )

        return createVisitor(getSourceCode(ctx), usedKeys)
      }
    }
    return defineCustomBlocksVisitor(
      context,
      createCustomBlockRule(createVisitorForJson),
      createCustomBlockRule(createVisitorForYaml)
    )
  } else if (
    sourceCode.parserServices.isJSON ||
    sourceCode.parserServices.isYAML
  ) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-unused-keys`)
      return {}
    }
    const src = options.src || getCwd(context)
    const extensions = options.extensions || ['.js', '.vue']

    const usedLocaleMessageKeys = usedKeysCache.collectKeysFromFiles(
      [src],
      extensions,
      context
    )

    const usedKeys = getUsedKeysMap(
      targetLocaleMessage,
      targetLocaleMessage.messages,
      usedLocaleMessageKeys,
      context
    )
    if (sourceCode.parserServices.isJSON) {
      return createVisitorForJson(sourceCode, usedKeys)
    } else if (sourceCode.parserServices.isYAML) {
      return createVisitorForYaml(sourceCode, usedKeys)
    }
    return {}
  } else {
    debug(`ignore ${filename} in no-unused-keys`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow unused localization keys',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-unused-keys.html',
      recommended: false
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          src: {
            type: 'string'
          },
          extensions: {
            type: 'array',
            items: { type: 'string' },
            default: ['.js', '.vue']
          },
          ignores: {
            type: 'array',
            items: { type: 'string' }
          },
          enableFix: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
