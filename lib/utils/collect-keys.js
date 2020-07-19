/**
 * @fileoverview Collect localization keys
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const { Linter } = require('eslint')
const { readFileSync } = require('fs')
const { resolve } = require('path')
const { defineTemplateBodyVisitor } = require('./index')
const { listFilesToProcess } = require('./glob-utils')
const debug = require('debug')('eslint-plugin-vue-i18n:collect-keys')

const INTERNAL_RULE_KEY = 'eslint-plugin-vue-i18n-internal-localization-keys'

function getKeyFromCallExpression (node) {
  const funcName = (node.callee.type === 'MemberExpression' && node.callee.property.name) || node.callee.name

  if (!/^(\$t|t|\$tc|tc)$/.test(funcName) || !node.arguments || !node.arguments.length) {
    return null
  }

  const [keyNode] = node.arguments
  if (keyNode.type !== 'Literal') { return null }

  return keyNode.value ? keyNode.value : null
}

function getKeyFromVAttribute (node) {
  if ((node.value && node.value.type === 'VExpressionContainer') &&
    (node.value.expression && node.value.expression.type === 'Literal')) {
    return node.value.expression.value
      ? node.value.expression.value
      : null
  } else {
    return null
  }
}

function create (context) {
  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='t']" (node) {
      debug("call VAttribute[directive=true][key.name='t'] handling ...")
      const key = getKeyFromVAttribute(node)
      if (key) {
        context.report({ node, message: key })
      }
    },

    "VAttribute[directive=true][key.name.name='t']" (node) {
      debug("call VAttribute[directive=true][key.name.name='t'] handling ...")
      const key = getKeyFromVAttribute(node)
      if (key) {
        context.report({ node, message: key })
      }
    },

    CallExpression (node) {
      debug('call CallExpression(for template) handling ...')
      const key = getKeyFromCallExpression(node)
      if (key) {
        context.report({ node, message: key })
      }
    }
  }, {
    CallExpression (node) {
      debug('CallExpression(for scripting) handling ...')
      const key = getKeyFromCallExpression(node)
      if (key) {
        context.report({ node, message: key })
      }
    }
  })
}

function processText (text, config, filename, linter) {
  const effectiveFilename = filename || '<text>'
  debug(`Linting ${effectiveFilename}`)

  const fixedResult = linter.verify(text, config, { filename })

  return fixedResult.map(
    message => message.ruleId === INTERNAL_RULE_KEY
      ? message.message
      : undefined
  ).filter(e => e)
}

/**
 * Collect the used keys.
 * @returns {string[]}
 */
function collectKeys (files, extensions) {
  debug('collectKeys', files, extensions)

  // setup linter options
  const config = {
    parser: 'vue-eslint-parser',
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      ecmaFeatures: { jsx: true }
    },
    extensions,
    env: { browser: true, es6: true },
    rules: { [INTERNAL_RULE_KEY]: 'error' }
  }

  // setup linter
  const linter = new Linter()
  linter.defineParser('vue-eslint-parser', require(require.resolve(config.parser)))
  linter.defineRule(INTERNAL_RULE_KEY, { create })

  const results = new Set()

  // detect used lodalization keys with linter
  for (const { filename, ignored } of listFilesToProcess(files, config)) {
    debug(`Processing file ... ${filename}`)

    if (ignored) { continue }

    const text = readFileSync(resolve(filename), 'utf8')

    for (const usedKey of processText(text, config, filename, linter)) {
      results.add(usedKey)
    }
  }

  return [...results]
}

module.exports = collectKeys
