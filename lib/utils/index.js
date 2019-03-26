/**
 * @fileoverview Utilities for eslint plugin
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const glob = require('glob')
const { resolve } = require('path')
const jsonAstParse = require('json-to-ast')

const UNEXPETECD_ERROR_LOCATION = { line: 1, column: 0 }

/**
 * Register the given visitor to parser services.
 * Borrow from GitHub `vuejs/eslint-plugin-vue` repo
 * @see https://github.com/vuejs/eslint-plugin-vue/blob/master/lib/utils/index.js#L54
 */
function defineTemplateBodyVisitor (context, templateBodyVisitor, scriptVisitor) {
  if (context.parserServices.defineTemplateBodyVisitor === null) {
    context.report({
      loc: UNEXPETECD_ERROR_LOCATION,
      message: 'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error'
    })
    return {}
  }
  return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
}

function findExistLocaleMessage (fullpath, localeMessages) {
  return localeMessages.find(message => message.fullpath === fullpath)
}

function loadLocaleMessages (pattern) {
  const files = glob.sync(pattern)
  return files.map(file => {
    const path = resolve(process.cwd(), file)
    const filename = file.replace(/^.*(\\|\/|:)/, '')
    const messages = require(path)
    return { fullpath: path, path: file, filename, messages }
  })
}

let localeMessages = null // locale messages
let localeDir = null // locale dir

function getLocaleMessages (localeDirectory) {
  if (localeDir !== localeDirectory) {
    localeDir = localeDirectory
    localeMessages = loadLocaleMessages(localeDir)
  } else {
    localeMessages = localeMessages || loadLocaleMessages(localeDir)
  }
  return localeMessages
}

function findMissingsFromLocaleMessages (localeMessages, key) {
  const missings = []
  const paths = key.split('.')
  localeMessages.forEach(localeMessage => {
    const length = paths.length
    let last = localeMessage.messages
    let i = 0
    while (i < length) {
      const value = last[paths[i]]
      if (value === undefined) {
        missings.push({
          message: `'${key}' does not exist in '${localeMessage.path}'`
        })
      }
      last = value
      i++
    }
  })
  return missings
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
      loc: UNEXPETECD_ERROR_LOCATION,
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
  UNEXPETECD_ERROR_LOCATION,
  defineTemplateBodyVisitor,
  getLocaleMessages,
  findMissingsFromLocaleMessages,
  findExistLocaleMessage,
  extractJsonInfo,
  generateJsonAst
}
