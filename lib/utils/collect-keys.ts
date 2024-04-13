/**
 * @fileoverview Collect localization keys
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { AST as VAST } from 'vue-eslint-parser'
import { resolve, extname } from 'path'
import { listFilesToProcess } from './glob-utils'
import { ResourceLoader } from './resource-loader'
import { CacheLoader } from './cache-loader'
import { defineCacheFunction } from './cache-function'
import debugBuilder from 'debug'
import type { RuleContext, VisitorKeys } from '../types'
import { getCwd } from './get-cwd'
import { isStaticLiteral, getStaticLiteralValue } from './index'
import type { Parser } from './parser-config-resolver'
import { buildParserFromConfig } from './parser-config-resolver'
const debug = debugBuilder('eslint-plugin-vue-i18n:collect-keys')

/**
 *
 * @param {CallExpression} node
 */
function getKeyFromCallExpression(node: VAST.ESLintCallExpression) {
  const funcName =
    (node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name) ||
    (node.callee.type === 'Identifier' && node.callee.name) ||
    ''

  if (
    !/^(\$t|t|\$tc|tc)$/.test(funcName) ||
    !node.arguments ||
    !node.arguments.length
  ) {
    return null
  }

  const [keyNode] = node.arguments
  if (!isStaticLiteral(keyNode)) {
    return null
  }

  return getStaticLiteralValue(keyNode)
}

/**
 * @param {VDirective} node
 */
function getKeyFromVDirective(node: VAST.VDirective) {
  if (
    node.value &&
    node.value.type === 'VExpressionContainer' &&
    isStaticLiteral(node.value.expression)
  ) {
    return getStaticLiteralValue(node.value.expression)
  } else {
    return null
  }
}

/**
 * @param {VAttribute} node
 */
function getKeyFromI18nComponent(node: VAST.VAttribute) {
  if (node.value && node.value.type === 'VLiteral') {
    return node.value.value
  } else {
    return null
  }
}

/**
 * Collect the used keys from source code text.
 * @param {string} text
 * @param {string} filename
 * @returns {string[]}
 */
function collectKeysFromText(filename: string, parser: Parser) {
  const effectiveFilename = filename || '<text>'
  debug(`collectKeysFromFile ${effectiveFilename}`)
  try {
    const parseResult = parser(filename)
    if (!parseResult) {
      return []
    }
    return collectKeysFromAST(parseResult.ast, parseResult.visitorKeys)
  } catch (_e) {
    return []
  }
}

/**
 * Collect the used keys from files.
 * @returns {ResourceLoader[]}
 */
function collectKeyResourcesFromFiles(fileNames: string[], cwd: string) {
  debug('collectKeysFromFiles', fileNames)

  const parser = buildParserFromConfig(cwd)

  const results = []

  // detect used lodalization keys with linter
  for (const filename of fileNames) {
    debug(`Processing file ... ${filename}`)

    results.push(
      new ResourceLoader(resolve(filename), () => {
        return collectKeysFromText(filename, parser)
      })
    )
  }

  return results
}

/**
 * Collect the used keys from Program node.
 * @returns {string[]}
 */
export function collectKeysFromAST(
  node: VAST.ESLintProgram,
  visitorKeys?: VisitorKeys
): string[] {
  debug('collectKeysFromAST')

  const results = new Set<string>()
  /**
   * @param {Node} node
   */
  function enterNode(node: VAST.Node) {
    if (node.type === 'VAttribute') {
      if (node.directive) {
        if (
          node.key.name.name === 't' ||
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          node.key.name === 't' /* vue-eslint-parser v5 */
        ) {
          debug(
            "call VAttribute[directive=true][key.name.name='t'] handling ..."
          )
          const key = getKeyFromVDirective(node)
          if (key) {
            results.add(String(key))
          }
        }
      } else {
        if (
          (node.key.name === 'path' &&
            (node.parent.parent.name === 'i18n' ||
              node.parent.parent.name === 'i18n-t' ||
              node.parent.parent.rawName === 'I18nT')) ||
          (node.key.name === 'keypath' &&
            (node.parent.parent.name === 'i18n-t' ||
              node.parent.parent.rawName === 'I18nT'))
        ) {
          debug(
            "call VElement:matches([name=i18n], [name=i18n-t], [name=I18nT]) > VStartTag > VAttribute[key.name='path'] handling ..."
          )

          const key = getKeyFromI18nComponent(node)
          if (key) {
            results.add(key)
          }
        }
      }
    } else if (node.type === 'CallExpression') {
      debug('CallExpression handling ...')
      const key = getKeyFromCallExpression(node)
      if (key) {
        results.add(String(key))
      }
    }
  }

  if (node.templateBody) {
    VAST.traverseNodes(node.templateBody, {
      enterNode,
      leaveNode() {
        // noop
      }
    })
  }
  VAST.traverseNodes(node, {
    visitorKeys,
    enterNode,
    leaveNode() {
      // noop
    }
  })

  return [...results]
}

class UsedKeysCache {
  private _targetFilesLoader: CacheLoader<
    [string, string[], string[], string],
    string[]
  >
  private _collectKeyResourcesFromFiles: (
    fileNames: string[],
    cwd: string
  ) => ResourceLoader<string[]>[]
  constructor() {
    this._targetFilesLoader = new CacheLoader((cwd, files, extensions) => {
      return listFilesToProcess(files, { cwd, extensions })
        .filter(f => !f.ignored && extensions.includes(extname(f.filename)))
        .map(f => f.filename)
    })
    this._collectKeyResourcesFromFiles = defineCacheFunction(
      (fileNames, cwd) => {
        return collectKeyResourcesFromFiles(fileNames, cwd)
      }
    )
  }
  /**
   * Collect the used keys from files.
   * @param {string[]} files
   * @param {string[]} extensions
   * @returns {string[]}
   */
  collectKeysFromFiles(
    files: string[],
    extensions: string[],
    context: RuleContext
  ) {
    const result = new Set<string>()
    for (const resource of this._getKeyResources(context, files, extensions)) {
      for (const key of resource.getResource()) {
        result.add(key)
      }
    }
    return [...result]
  }

  /**
   * @returns {ResourceLoader[]}
   */
  _getKeyResources(
    context: RuleContext,
    files: string[],
    extensions: string[]
  ) {
    const cwd = getCwd(context)
    const fileNames = this._targetFilesLoader.get(cwd, files, extensions, cwd)
    return this._collectKeyResourcesFromFiles(fileNames, cwd)
  }
}

export const usedKeysCache = new UsedKeysCache() // used locale message keys
