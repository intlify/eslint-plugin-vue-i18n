/**
 * @fileoverview Utilities for eslint plugin
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const glob = require('glob')
const { resolve } = require('path')
const jsonAstParse = require('json-to-ast')
const { LocaleMessage, LocaleMessages } = require('./locale-messages')

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
  if (context.parserServices.defineTemplateBodyVisitor === null) {
    context.report({
      loc: UNEXPECTED_ERROR_LOCATION,
      message: 'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error'
    })
    return {}
  }
  return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
}

/**
 * @param {SettingsVueI18nLocaleDir} localeDir
 * @returns {LocaleMessages}
 */
function loadLocaleMessages (localeDir) {
  if (typeof localeDir === 'string') {
    return loadLocaleMessages({ pattern: localeDir, localeKey: 'file' })
  } else {
    const files = glob.sync(localeDir.pattern)
    return new LocaleMessages(files.map(file => {
      const fullpath = resolve(process.cwd(), file)
      return new LocaleMessage({ fullpath, path: file, localeKey: localeDir.localeKey || 'file' })
    }))
  }
}

let localeMessages = null // locale messages
let localeDir = null // locale dir

/**
 * @param {SettingsVueI18nLocaleDir} localeDirectory
 * @returns {LocaleMessages}
 */
function getLocaleMessages (localeDirectory) {
  if (localeDir !== localeDirectory) {
    localeDir = localeDirectory
    localeMessages = loadLocaleMessages(localeDir)
  } else {
    localeMessages = localeMessages || loadLocaleMessages(localeDir)
  }
  return localeMessages
}

function extractJsonInfo (context, node) {
  try {
    const [str, filename] = node.comments
    return [
      Buffer.from(str.value, 'base64').toString(),
      Buffer.from(filename.value, 'base64').toString()
    ]
  } catch (e) {
    context.report({
      loc: UNEXPECTED_ERROR_LOCATION,
      message: e.message
    })
    return []
  }
}

function generateJsonAst (context, json, filename) {
  let ast = null

  try {
    ast = jsonAstParse(json, { loc: true, source: filename })
  } catch (e) {
    const { message, line, column } = e
    context.report({
      message,
      loc: { line, column }
    })
  }

  return ast
}

module.exports = {
  UNEXPECTED_ERROR_LOCATION,
  defineTemplateBodyVisitor,
  getLocaleMessages,
  extractJsonInfo,
  generateJsonAst
}
