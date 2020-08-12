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
  SettingsVueI18nLocaleDir
} from '../types'

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

/**
 * @param {string[]} files
 * @param {LocaleKeyType} localeKey
 * @returns {LocaleMessage[]}
 */
function loadLocaleMessages(files: string[], localeKey: LocaleKeyType) {
  return files.map(file => {
    const fullpath = resolve(process.cwd(), file)
    return new FileLocaleMessage({ fullpath, localeKey })
  })
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
    files: string[],
    localeKey: LocaleKeyType,
    cwd: string
  ) => FileLocaleMessage[]
  constructor() {
    this._targetFilesLoader = new CacheLoader(pattern => glob.sync(pattern))

    this._loadLocaleMessages = defineCacheFunction((files, localeKey) => {
      return loadLocaleMessages(files, localeKey)
    })
  }
  /**
   * @param {SettingsVueI18nLocaleDir} localeDir
   * @returns {LocaleMessage[]}
   */
  getLocaleMessagesFromLocaleDir(localeDir: SettingsVueI18nLocaleDir) {
    const cwd = process.cwd()
    const targetFilesLoader = this._targetFilesLoader
    let files
    let localeKey: LocaleKeyType
    if (typeof localeDir === 'string') {
      files = targetFilesLoader.get(localeDir, cwd)
      localeKey = 'file'
    } else {
      files = targetFilesLoader.get(localeDir.pattern, cwd)
      localeKey = String(localeDir.localeKey ?? 'file') as LocaleKeyType
    }
    return this._loadLocaleMessages(files, localeKey, cwd)
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
