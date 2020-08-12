/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as VAST } from 'vue-eslint-parser'
import type { AST as JSONAST } from 'eslint-plugin-jsonc'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { collectKeysFromAST, usedKeysCache } from '../utils/collect-keys'
import { collectLinkedKeys } from '../utils/collect-linked-keys'
import { getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { LocaleMessage } from '../utils/locale-messages'
import type {
  I18nLocaleMessageDictionary,
  RuleContext,
  RuleListener,
  RuleFixer,
  Fix,
  SourceCode,
  Range
} from '../types'
import { joinPath } from '../utils/key-path'
const debug = debugBuilder('eslint-plugin-vue-i18n:no-unused-keys')

type UsedKeys = {
  [key: string]: string | UsedKeys
  [key: number]: string | UsedKeys
}
interface PathStack {
  usedKeys: UsedKeys
  keyPath: string
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
  usedkeys: string[]
): UsedKeys {
  /** @type {UsedKeys} */
  const usedKeysMap: UsedKeys = {}

  for (const key of [...usedkeys, ...collectLinkedKeys(values)]) {
    const paths = key.split('.')
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
  const filename = context.getFilename()
  const options = (context.options && context.options[0]) || {}
  const enableFix = options.enableFix

  /**
   * Create node visitor
   * @param {UsedKeys} usedKeys
   * @param {object} option
   * @param { (node: JSONNode | YAMLNode) => boolean } option.skipNode
   * @param { (parentPath: string, node: JSONNode | YAMLNode) => {path: string, key: string | number} | null } option.resolveKeysForNode
   * @param { (node: JSONNode | YAMLNode) => JSONNode | YAMLNode | null } option.resolveReportNode
   * @param { (node: JSONNode | YAMLNode) => null | ((fixer: RuleFixer) => null | Fix | Fix[] | IterableIterator<Fix>) } option.buildFixer
   * @param { (node: JSONNode[] | YAMLNode[]) => ((fixer: RuleFixer) => null | Fix | Fix[] | IterableIterator<Fix>) } option.buildAllFixer
   */
  function createVisitor<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    usedKeys: UsedKeys,
    {
      skipNode,
      resolveKey,
      resolveReportNode,
      buildFixer,
      buildAllFixer
    }: {
      skipNode: (node: N) => boolean
      resolveKey: (node: N) => string | number | null
      resolveReportNode: (node: N) => N | null
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
    let pathStack: PathStack = { usedKeys, keyPath: '' }
    const reports: { node: N; keyPath: string }[] = []
    return {
      /**
       * @param {JSONNode | YAMLNode} node
       */
      enterNode(node: N) {
        if (skipNode(node)) {
          return
        }

        const key = resolveKey(node)
        if (key == null) {
          return
        }
        const keyPath = joinPath(pathStack.keyPath, key)
        pathStack = {
          upper: pathStack,
          node,
          usedKeys:
            (pathStack.usedKeys && (pathStack.usedKeys[key] as UsedKeys)) ||
            false,
          keyPath
        }
        const isUnused = !pathStack.usedKeys
        if (isUnused) {
          const reportNode = resolveReportNode(node)
          if (reportNode == null) {
            // ignore
            return
          }
          reports.push({
            node: reportNode,
            keyPath
          })
        }
      },
      /**
       * @param {JSONNode | YAMLNode} node
       */
      leaveNode(node: N) {
        if (pathStack.node === node) {
          pathStack = pathStack.upper!
        }
      },
      reports() {
        for (const { node, keyPath } of reports) {
          const fix = buildFixer(node)
          context.report({
            message: `unused '${keyPath}' key`,
            loc: node.loc,
            fix: enableFix ? fix : null,
            suggest: [
              {
                desc: `Remove the '${keyPath}' key.`,
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
    return createVisitor<JSONAST.JSONNode>(usedKeys, {
      /**
       * @param {JSONNode} node
       */
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
      /**
       * @param {JSONNode} node
       */
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

      /**
       * @param {JSONNode} node
       */
      resolveReportNode(node) {
        if (
          node.type === 'JSONObjectExpression' ||
          node.type === 'JSONArrayExpression'
        ) {
          // ignore report
          return null
        }
        const parent = node.parent!
        return parent.type === 'JSONProperty' ? parent.key : node
      },

      /**
       * @param {JSONNode} node
       */
      buildFixer(node) {
        return fixer => fixer.removeRange(fixRemoveRange(node))
      },

      /**
       * @param {JSONNode[]} node
       */
      buildAllFixer(nodes) {
        return function* (fixer) {
          yield* fixAllRemoveKeys(fixer, nodes)
        }
      }
    })

    function* fixAllRemoveKeys(fixer: RuleFixer, nodes: JSONAST.JSONNode[]) {
      const ranges = nodes.map(node => fixRemoveRange(node))

      let preLast = 0
      for (const range of ranges) {
        yield fixer.removeRange([Math.max(preLast, range[0]), range[1]])
        preLast = range[1]
      }
    }

    /**
     * @param {JSONNode} node
     */
    function fixRemoveRange(node: JSONAST.JSONNode): Range {
      const parent = node.parent!
      let removeNode
      let isFirst = false
      let isLast = false
      if (parent.type === 'JSONProperty') {
        removeNode = parent
        const index = parent.parent.properties.indexOf(parent)
        isFirst = index === 0
        isLast = index === parent.parent.properties.length - 1
      } else {
        removeNode = node
        if (parent.type === 'JSONArrayExpression') {
          const index = parent.elements.indexOf(node as never)
          isFirst = index === 0
          isLast = index === parent.elements.length - 1
        }
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
      return range
    }
  }

  /**
   * Create node visitor for YAML
   * @param {SourceCode} sourceCode
   * @param {UsedKeys} usedKeys
   */
  function createVisitorForYaml(sourceCode: SourceCode, usedKeys: UsedKeys) {
    const yamlKeyNodes = new Set()
    return createVisitor<YAMLAST.YAMLNode>(usedKeys, {
      /**
       * @param {YAMLNode} node
       */
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

        if (node.type === 'YAMLPair') {
          yamlKeyNodes.add(node.key)
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
        return false
      },
      /**
       * @param {YAMLContent | YAMLWithMeta} node
       */
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

      /**
       * @param {YAMLContent | YAMLWithMeta} node
       */
      resolveReportNode(node) {
        if (node.type === 'YAMLMapping' || node.type === 'YAMLSequence') {
          // ignore report
          return null
        }
        const parent = node.parent!
        return parent.type === 'YAMLPair' ? parent.key : node
      },

      /**
       * @param {YAMLNode} node
       */
      buildFixer(node) {
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

      /**
       * @param {YAMLNode[]} node
       */
      buildAllFixer(nodes) {
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
              if (parent.entries.every(p => removeNodes.includes(p))) {
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

  if (extname(filename) === '.vue') {
    return {
      Program(node: VAST.ESLintProgram) {
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
        const usedLocaleMessageKeys = collectKeysFromAST(
          node,
          context.getSourceCode().visitorKeys
        )

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
          const usedKeys = getUsedKeysMap(
            targetLocaleMessage,
            targetLocaleMessage.messages,
            usedLocaleMessageKeys
          )

          const parserLang = targetLocaleMessage.getParserLang()

          let visitor
          if (parserLang === 'json') {
            visitor = createVisitorForJson(sourceCode, usedKeys)
          } else if (parserLang === 'yaml') {
            visitor = createVisitorForYaml(sourceCode, usedKeys)
          }

          if (visitor == null) {
            return
          }

          targetLocaleMessage.traverseNodes({
            enterNode: visitor.enterNode,
            leaveNode: visitor.leaveNode
          })

          visitor.reports()
        }
      }
    }
  } else if (context.parserServices.isJSON || context.parserServices.isYAML) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in no-unused-keys`)
      return {}
    }
    const src = options.src || process.cwd()
    const extensions = options.extensions || ['.js', '.vue']

    const usedLocaleMessageKeys = usedKeysCache.collectKeysFromFiles(
      [src],
      extensions
    )
    const sourceCode = context.getSourceCode()

    const usedKeys = getUsedKeysMap(
      targetLocaleMessage,
      targetLocaleMessage.messages,
      usedLocaleMessageKeys
    )
    if (context.parserServices.isJSON) {
      const { enterNode, leaveNode, reports } = createVisitorForJson(
        sourceCode,
        usedKeys
      )

      return {
        '[type=/^JSON/]': enterNode,
        '[type=/^JSON/]:exit': leaveNode,
        'Program:exit'() {
          reports()
        }
      }
    } else if (context.parserServices.isYAML) {
      const { enterNode, leaveNode, reports } = createVisitorForYaml(
        sourceCode,
        usedKeys
      )

      return {
        '[type=/^YAML/]': enterNode,
        '[type=/^YAML/]:exit': leaveNode,
        'Program:exit'() {
          reports()
        }
      }
    }
    return {}
  } else {
    debug(`ignore ${filename} in no-unused-keys`)
    return {}
  }
}

export = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow unused localization keys',
      category: 'Best Practices',
      recommended: false
    },
    fixable: 'code',
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
          enableFix: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
}
