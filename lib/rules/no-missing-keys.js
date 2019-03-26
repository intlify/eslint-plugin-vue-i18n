/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const {
  UNEXPETECD_ERROR_LOCATION,
  defineTemplateBodyVisitor,
  getLocaleMessages,
  findMissingsFromLocaleMessages
} = require('../utils/index')

function create (context) {
  const { settings } = context
  if (!settings['vue-i18n'] || !settings['vue-i18n'].localeDir) {
    context.report({
      loc: UNEXPETECD_ERROR_LOCATION,
      message: `You need to 'localeDir' at 'settings. See the 'eslint-plugin-vue-i18n documentation`
    })
    return {}
  }

  const localeDir = settings['vue-i18n'].localeDir
  const localeMessages = getLocaleMessages(localeDir)

  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='t']" (node) {
      checkDirective(context, localeDir, localeMessages, node)
    },

    "VAttribute[directive=true][key.name.name='t']" (node) {
      checkDirective(context, localeDir, localeMessages, node)
    },

    "VElement[name=i18n] > VStartTag > VAttribute[key.name='path']" (node) {
      checkComponent(context, localeDir, localeMessages, node)
    },

    "VElement[name=i18n] > VStartTag > VAttribute[key.name.name='path']" (node) {
      checkComponent(context, localeDir, localeMessages, node)
    },

    CallExpression (node) {
      checkCallExpression(context, localeDir, localeMessages, node)
    }
  }, {
    CallExpression (node) {
      checkCallExpression(context, localeDir, localeMessages, node)
    }
  })
}

function checkDirective (context, localeDir, localeMessages, node) {
  if ((node.value && node.value.type === 'VExpressionContainer') &&
  (node.value.expression && node.value.expression.type === 'Literal')) {
    const key = node.value.expression.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = findMissingsFromLocaleMessages(localeMessages, key, localeDir)
    if (missings.length) {
      missings.forEach(missing => context.report({ node, ...missing }))
    }
  }
}

function checkComponent (context, localeDir, localeMessages, node) {
  if (node.value && node.value.type === 'VLiteral') {
    const key = node.value.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = findMissingsFromLocaleMessages(localeMessages, key, localeDir)
    if (missings.length) {
      missings.forEach(missing => context.report({ node, ...missing }))
    }
  }
}

function checkCallExpression (context, localeDir, localeMessages, node) {
  const funcName = (node.callee.type === 'MemberExpression' && node.callee.property.name) || node.callee.name

  if (!/^(\$t|t|\$tc|tc)$/.test(funcName) || !node.arguments || !node.arguments.length) {
    return
  }

  const [keyNode] = node.arguments
  if (keyNode.type !== 'Literal') { return }

  const key = keyNode.value
  if (!key) {
    // TODO: should be error
    return
  }

  const missings = findMissingsFromLocaleMessages(localeMessages, key, localeDir)
  if (missings.length) {
    missings.forEach(missing => context.report({ node, ...missing }))
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow missing locale message key at localization methods',
      category: 'Recommended',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create
}
