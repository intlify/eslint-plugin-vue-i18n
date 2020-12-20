/**
 * @fileoverview Utilities for eslint plugin
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as VAST } from 'vue-eslint-parser'
import glob from 'glob'
import { resolve, dirname, extname } from 'path'
import {
  FileLocaleMessage,
  BlockLocaleMessage,
  LocaleMessages
} from './locale-messages'
import { CacheLoader } from './cache-loader'
import { defineCacheFunction } from './cache-function'
import type {
  RuleContext,
  TemplateListener,
  RuleListener,
  LocaleKeyType,
  SettingsVueI18nLocaleDir,
  SettingsVueI18nLocaleDirObject,
  SettingsVueI18nLocaleDirGlob,
  CustomBlockVisitorFactory
} from '../types'
import * as jsoncESLintParser from 'jsonc-eslint-parser'
import * as yamlESLintParser from 'yaml-eslint-parser'

interface LocaleFiles {
  files: string[]
  localeKey: LocaleKeyType
}
const UNEXPECTED_ERROR_LOCATION = { line: 1, column: 0 }
/**
 * Register the given visitor to parser services.
 * Borrow from GitHub `vuejs/eslint-plugin-vue` repo
 * @see https://github.com/vuejs/eslint-plugin-vue/blob/master/lib/utils/index.js#L54
 */
export function defineTemplateBodyVisitor(
  context: RuleContext,
  templateBodyVisitor: TemplateListener,
  scriptVisitor?: RuleListener
): RuleListener {
  if (context.parserServices.defineTemplateBodyVisitor == null) {
    const filename = context.getFilename()
    if (extname(filename) === '.vue') {
      context.report({
        loc: UNEXPECTED_ERROR_LOCATION,
        message:
          'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error'
      })
    }
    return {}
  }
  return context.parserServices.defineTemplateBodyVisitor(
    templateBodyVisitor,
    scriptVisitor
  )
}

function loadLocaleMessages(
  localeFilesList: LocaleFiles[],
  cwd: string
): FileLocaleMessage[] {
  const results: FileLocaleMessage[] = []
  const checkDupeMap: { [file: string]: LocaleKeyType[] } = {}
  for (const { files, localeKey } of localeFilesList) {
    for (const file of files) {
      const localeKeys = checkDupeMap[file] || (checkDupeMap[file] = [])
      if (localeKeys.includes(localeKey)) {
        continue
      }
      localeKeys.push(localeKey)
      const fullpath = resolve(cwd, file)
      results.push(new FileLocaleMessage({ fullpath, localeKey }))
    }
  }
  return results
}

/** @type {Set<RuleContext>} */
const puttedSettingsError = new WeakSet<RuleContext>()

/**
 * @param {RuleContext} context
 * @returns {LocaleMessages}
 */
export function getLocaleMessages(context: RuleContext): LocaleMessages {
  const { settings } = context
  /** @type {SettingsVueI18nLocaleDir | null} */
  const localeDir =
    (settings['vue-i18n'] && settings['vue-i18n'].localeDir) || null
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
  if (!localeDir && !i18nBlocks.length) {
    if (!puttedSettingsError.has(context)) {
      context.report({
        loc: UNEXPECTED_ERROR_LOCATION,
        message: `You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation`
      })
      puttedSettingsError.add(context)
    }
    return new LocaleMessages([])
  }

  return new LocaleMessages([
    ...(getLocaleMessagesFromI18nBlocks(context, i18nBlocks) || []),
    ...((localeDir &&
      localeDirLocaleMessagesCache.getLocaleMessagesFromLocaleDir(localeDir)) ||
      [])
  ])
}

class LocaleDirLocaleMessagesCache {
  private _targetFilesLoader: CacheLoader<[string, string], string[]>
  private _loadLocaleMessages: (
    localeFilesList: LocaleFiles[],
    cwd: string
  ) => FileLocaleMessage[]
  constructor() {
    this._targetFilesLoader = new CacheLoader(pattern => glob.sync(pattern))

    this._loadLocaleMessages = defineCacheFunction(
      (localeFilesList: LocaleFiles[], cwd) => {
        return loadLocaleMessages(localeFilesList, cwd)
      }
    )
  }
  /**
   * @param {SettingsVueI18nLocaleDir} localeDir
   * @returns {LocaleMessage[]}
   */
  getLocaleMessagesFromLocaleDir(localeDir: SettingsVueI18nLocaleDir) {
    const cwd = process.cwd()
    let localeFilesList: LocaleFiles[]
    if (Array.isArray(localeDir)) {
      localeFilesList = localeDir.map(dir => this._toLocaleFiles(dir, cwd))
    } else {
      localeFilesList = [this._toLocaleFiles(localeDir, cwd)]
    }
    return this._loadLocaleMessages(localeFilesList, cwd)
  }

  private _toLocaleFiles(
    localeDir: SettingsVueI18nLocaleDirGlob | SettingsVueI18nLocaleDirObject,
    cwd: string
  ): LocaleFiles {
    const targetFilesLoader = this._targetFilesLoader
    if (typeof localeDir === 'string') {
      return {
        files: targetFilesLoader.get(localeDir, cwd),
        localeKey: 'file'
      }
    } else {
      return {
        files: targetFilesLoader.get(localeDir.pattern, cwd),
        localeKey: String(localeDir.localeKey ?? 'file') as LocaleKeyType
      }
    }
  }
}

const localeDirLocaleMessagesCache = new LocaleDirLocaleMessagesCache()

/** @type {Map<Program, LocaleMessage[]>} */
const i18nBlockLocaleMessages = new WeakMap()

/**
 * @param {RuleContext} context
 * @param {VElement[]} i18nBlocks
 * @returns {LocaleMessage[]}
 */
function getLocaleMessagesFromI18nBlocks(
  context: RuleContext,
  i18nBlocks: VAST.VElement[]
) {
  const sourceCode = context.getSourceCode()
  let localeMessages = i18nBlockLocaleMessages.get(sourceCode.ast)
  if (localeMessages) {
    return localeMessages
  }
  const filename = context.getFilename()
  localeMessages = i18nBlocks
    .map(block => {
      const attrs: { [name: string]: string | undefined } = {}
      for (const attr of block.startTag.attributes) {
        if (!attr.directive && attr.value) {
          attrs[attr.key.name] = attr.value.value
        }
      }
      let localeMessage = null
      if (attrs.src) {
        const fullpath = resolve(dirname(filename), attrs.src)

        if (attrs.locale) {
          localeMessage = new FileLocaleMessage({
            fullpath,
            locales: [attrs.locale],
            localeKey: 'file'
          })
        } else {
          localeMessage = new FileLocaleMessage({
            fullpath,
            localeKey: 'key'
          })
        }
      } else if (block.endTag) {
        if (attrs.locale) {
          localeMessage = new BlockLocaleMessage({
            block,
            fullpath: filename,
            locales: [attrs.locale],
            localeKey: 'file',
            context,
            lang: attrs.lang
          })
        } else {
          localeMessage = new BlockLocaleMessage({
            block,
            fullpath: filename,
            localeKey: 'key',
            context,
            lang: attrs.lang
          })
        }
      }

      if (localeMessage) {
        return localeMessage
      }
      // unknown
      return null
    })
    .filter(e => e)
  i18nBlockLocaleMessages.set(sourceCode.ast, localeMessages)
  return localeMessages
}

export function defineCustomBlocksVisitor(
  context: RuleContext,
  jsonRule: CustomBlockVisitorFactory,
  yamlRule: CustomBlockVisitorFactory
): RuleListener {
  if (!context.parserServices.defineCustomBlocksVisitor) {
    return {}
  }
  const jsonVisitor = context.parserServices.defineCustomBlocksVisitor(
    context,
    jsoncESLintParser,
    {
      target(lang: string | null, block: VAST.VElement): boolean {
        if (block.name !== 'i18n') {
          return false
        }
        return !lang || lang === 'json' || lang === 'json5'
      },
      create: jsonRule
    }
  )
  const yamlVisitor = context.parserServices.defineCustomBlocksVisitor(
    context,
    yamlESLintParser,
    {
      target(lang: string | null, block: VAST.VElement): boolean {
        if (block.name !== 'i18n') {
          return false
        }
        return lang === 'yaml' || lang === 'yml'
      },
      create: yamlRule
    }
  )

  return compositingVisitors(jsonVisitor, yamlVisitor)
}

function compositingVisitors(
  visitor: RuleListener,
  ...visitors: RuleListener[]
) {
  for (const v of visitors) {
    for (const key in v) {
      if (visitor[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const o = visitor[key] as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visitor[key] = (...args: any[]) => {
          o(...args)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(v[key] as any)(...args)
        }
      } else {
        visitor[key] = v[key]
      }
    }
  }
  return visitor
}
