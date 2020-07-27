/**
 * @fileoverview Utilities for eslint plugin
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const glob = require('glob')
const { resolve, dirname, extname } = require('path')
const { FileLocaleMessage, BlockLocaleMessage, LocaleMessages } = require('./locale-messages')

/**
 * @typedef {import('vue-eslint-parser').AST.ESLintProgram} Program
 * @typedef {import('vue-eslint-parser').AST.VElement} VElement
 * @typedef {import('vue-eslint-parser').AST.VAttribute} VAttribute
 */

const UNEXPECTED_ERROR_LOCATION = { line: 1, column: 0 }

/**
 * How to determine the locale for localization messages.
 * - `'file'` ... Determine the locale name from the filename. The resource file should only contain messages for that locale.
 *                Use this option if you use `vue-cli-plugin-i18n`. This method is also used when String option is specified.
 * - `'key'` ...  Determine the locale name from the root key name of the file contents. The value of that key should only contain messages for that locale.
 *                Used when the resource file is in the format given to the `messages` option of the `VueI18n` constructor option.
 * @typedef {'file' | 'key'} LocaleKeyType
 */
/**
 * Type of `settings['vue-i18n'].localeDir`
 * @typedef {SettingsVueI18nLocaleDirGlob | SettingsVueI18nLocaleDirObject} SettingsVueI18nLocaleDir
 * @typedef {string} SettingsVueI18nLocaleDirGlob A glob for specifying files that store localization messages of project.
 * @typedef {object} SettingsVueI18nLocaleDirObject Specifies a glob and messages format type.
 * @property {string} pattern A glob for specifying files that store localization messages of project.
 * @property {LocaleKeyType} localeKey Specifies how to determine the locale for localization messages.
 */
/**
 * @typedef {import('./locale-messages').LocaleMessage} LocaleMessage
 * @typedef {import('./locale-messages').LocaleMessages} LocaleMessages
 */

/**
 * Register the given visitor to parser services.
 * Borrow from GitHub `vuejs/eslint-plugin-vue` repo
 * @see https://github.com/vuejs/eslint-plugin-vue/blob/master/lib/utils/index.js#L54
 */
function defineTemplateBodyVisitor (context, templateBodyVisitor, scriptVisitor) {
  if (context.parserServices.defineTemplateBodyVisitor == null) {
    const filename = context.getFilename()
    if (extname(filename) === '.vue') {
      context.report({
        loc: UNEXPECTED_ERROR_LOCATION,
        message: 'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error'
      })
    }
    return {}
  }
  return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
}

/**
 * @param {SettingsVueI18nLocaleDir} localeDir
 * @returns {LocaleMessage[]}
 */
function loadLocaleMessages (localeDir) {
  if (typeof localeDir === 'string') {
    return loadLocaleMessages({ pattern: localeDir, localeKey: 'file' })
  } else {
    const files = glob.sync(localeDir.pattern)
    return files.map(file => {
      const fullpath = resolve(process.cwd(), file)
      return new FileLocaleMessage({ fullpath, localeKey: localeDir.localeKey || 'file' })
    })
  }
}

/** @type {Set<RuleContext>} */
const puttedSettingsError = new WeakSet()

/**
 * @param {RuleContext} context
 * @returns {LocaleMessages}
 */
function getLocaleMessages (context) {
  const { settings } = context
  /** @type {SettingsVueI18nLocaleDir | null} */
  const localeDir = settings['vue-i18n'] && settings['vue-i18n'].localeDir || null
  const documentFragment = context.parserServices.getDocumentFragment && context.parserServices.getDocumentFragment()
  /** @type {VElement[]} */
  const i18nBlocks = documentFragment && documentFragment.children.filter(node => node.type === 'VElement' && node.name === 'i18n') || []
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
    ...(localeDir && getLocaleMessagesFromLocaleDir(localeDir) || [])
  ])
}

/** @type {LocaleMessage[] | null} */
let localeDirLocaleMessages = null // locale messages
let localeDir = null // locale dir
/** @type {Map<Program, LocaleMessage[]>} */
const i18nBlockLocaleMessages = new WeakMap()

/**
 * @param {SettingsVueI18nLocaleDir} localeDirectory
 * @returns {LocaleMessage[]}
 */
function getLocaleMessagesFromLocaleDir (localeDirectory) {
  if (localeDir !== localeDirectory) {
    localeDir = localeDirectory
    localeDirLocaleMessages = loadLocaleMessages(localeDir)
  } else {
    localeDirLocaleMessages = localeDirLocaleMessages || loadLocaleMessages(localeDir)
  }
  return localeDirLocaleMessages
}

/**
 * @param {RuleContext} context
 * @param {VElement[]} i18nBlocks
 * @returns {LocaleMessage[]}
 */
function getLocaleMessagesFromI18nBlocks (context, i18nBlocks) {
  const sourceCode = context.getSourceCode()
  let localeMessages = i18nBlockLocaleMessages.get(sourceCode.ast)
  if (localeMessages) {
    return localeMessages
  }
  const filename = context.getFilename()
  localeMessages = i18nBlocks.map(block => {
    const attrs = {}
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
  }).filter(e => e)
  i18nBlockLocaleMessages.set(sourceCode.ast, localeMessages)
  return localeMessages
}

module.exports = {
  defineTemplateBodyVisitor,
  getLocaleMessages
}
