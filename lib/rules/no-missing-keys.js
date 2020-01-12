/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const {
  UNEXPECTED_ERROR_LOCATION,
  defineTemplateBodyVisitor,
  getLocaleMessages,
  getSettings,
  findMissingsFromLocaleMessages,
  validateSettings,
} = require('../utils/index')

function create (context) {
  if (!validateSettings(context)) {
    return {}
  }

  const localeMessages = getLocaleMessages(context)

  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='t']" (node) {
      checkDirective(context, localeMessages, node)
    },

    "VAttribute[directive=true][key.name.name='t']" (node) {
      checkDirective(context, localeMessages, node)
    },

    "VElement[name=i18n] > VStartTag > VAttribute[key.name='path']" (node) {
      checkComponent(context, localeMessages, node)
    },

    "VElement[name=i18n] > VStartTag > VAttribute[key.name.name='path']" (node) {
      checkComponent(context, localeMessages, node)
    },

    CallExpression (node) {
      checkCallExpression(context, localeMessages, node)
    }
  }, {
    CallExpression (node) {
      checkCallExpression(context, localeMessages, node)
    }
  })
}

function checkDirective (context, localeMessages, node) {
  if ((node.value && node.value.type === 'VExpressionContainer') &&
  (node.value.expression && node.value.expression.type === 'Literal')) {
    const key = node.value.expression.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = findMissingsFromLocaleMessages(localeMessages, key)
    if (missings.length) {
      missings.forEach(missing => context.report({ node, ...missing }))
    }
  }
}

function checkComponent (context, localeMessages, node) {
  if (node.value && node.value.type === 'VLiteral') {
    const key = node.value.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = findMissingsFromLocaleMessages(localeMessages, key)
    if (missings.length) {
      missings.forEach(missing => context.report({ node, ...missing }))
    }
  }
}

function checkCallExpression (context, localeMessages, node) {
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

  const missings = findMissingsFromLocaleMessages(localeMessages, key)
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
