/**
 * @fileoverview Utilities for eslint plugin
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const glob = require('glob')
const { resolve } = require('path')
const jsonAstParse = require('json-to-ast')

const UNEXPECTED_ERROR_LOCATION = { line: 1, column: 0 }

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

function unwrapTypes (node) {
  return node.type === 'TSAsExpression' ? node.expression : node
}

function isVueFile (path) {
  return path.endsWith('.vue') || path.endsWith('.jsx')
}

function isVueComponentFile (node, path) {
  return isVueFile(path) &&
    node.type === 'ExportDefaultDeclaration' &&
    node.declaration.type === 'ObjectExpression'
}

function isVueComponent (node) {
  if (node.type === 'CallExpression') {
    const callee = node.callee

    if (callee.type === 'MemberExpression') {
      const calleeObject = unwrapTypes(callee.object)

      const isFullVueComponent = calleeObject.type === 'Identifier' &&
        calleeObject.name === 'Vue' &&
        callee.property.type === 'Identifier' &&
        ['component', 'mixin', 'extend'].indexOf(callee.property.name) > -1 &&
        node.arguments.length >= 1 &&
        node.arguments.slice(-1)[0].type === 'ObjectExpression'

      return isFullVueComponent
    }

    if (callee.type === 'Identifier') {
      const isDestructedVueComponent = callee.name === 'component' &&
        node.arguments.length >= 1 &&
        node.arguments.slice(-1)[0].type === 'ObjectExpression'

      return isDestructedVueComponent
    }
  }

  return false
}

function executeOnVueComponent (context, cb) {
  const filePath = context.getFilename()
  const sourceCode = context.getSourceCode()
  const componentComments = sourceCode.getAllComments().filter(comment => /@vue\/component/g.test(comment.value))
  const foundNodes = []

  const isDuplicateNode = node => {
    if (foundNodes.some(el => el.loc.start.line === node.loc.start.line)) { return true }
    foundNodes.push(node)
    return false
  }

  return {
    'ObjectExpression:exit' (node) {
      console.log('ObjectExpression', filePath, node)
      if (!componentComments.some(el => el.loc.end.line === node.loc.start.line - 1) || isDuplicateNode(node)) { return }
      cb(node)
    },
    'ExportDefaultDeclaration:exit' (node) {
      console.log('ExportDefaultDeclaration', filePath, node)
      // export default {} in .vue || .js(x)
      if (isDuplicateNode(node.declaration)) { return }
      cb(node.declaration)
    },
    'CallExpression:exit' (node) {
      console.log('CallExpression:exit')
      // Vue.component('xxx', {}) || component('xxx', {})
      if (!isVueComponent(node) || isDuplicateNode(node.arguments.slice(-1)[0])) { return }
      cb(node.arguments.slice(-1)[0])
    }
  }
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
      const value = last && last[paths[i]]
      if (value === undefined) {
        missings.push({
          message: `'${key}' does not exist`
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
  executeOnVueComponent,
  getLocaleMessages,
  findMissingsFromLocaleMessages,
  findExistLocaleMessage,
  extractJsonInfo,
  generateJsonAst
}
