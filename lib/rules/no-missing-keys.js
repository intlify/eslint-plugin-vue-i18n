/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const {
  defineTemplateBodyVisitor,
  getLocaleMessages
} = require('../utils/index')

function create (context) {
  return defineTemplateBodyVisitor(context, {
    "VAttribute[directive=true][key.name='t']" (node) {
      checkDirective(context, node)
    },

    "VAttribute[directive=true][key.name.name='t']" (node) {
      checkDirective(context, node)
    },

    "VElement[name=i18n] > VStartTag > VAttribute[key.name='path']" (node) {
      checkComponent(context, node)
    },

    "VElement[name=i18n] > VStartTag > VAttribute[key.name.name='path']" (node) {
      checkComponent(context, node)
    },

    CallExpression (node) {
      checkCallExpression(context, node)
    }
  }, {
    CallExpression (node) {
      checkCallExpression(context, node)
    }
  })
}

function checkDirective (context, node) {
  const localeMessages = getLocaleMessages(context)
  if (localeMessages.isEmpty()) { return }
  if ((node.value && node.value.type === 'VExpressionContainer') &&
  (node.value.expression && node.value.expression.type === 'Literal')) {
    const key = node.value.expression.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = localeMessages.findMissingPaths(key)
    if (missings.length) {
      missings.forEach((data) => context.report({ node, messageId: 'missing', data }))
    }
  }
}

function checkComponent (context, node) {
  const localeMessages = getLocaleMessages(context)
  if (localeMessages.isEmpty()) { return }
  if (node.value && node.value.type === 'VLiteral') {
    const key = node.value.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = localeMessages.findMissingPaths(key)
    if (missings.length) {
      missings.forEach((data) => context.report({ node, messageId: 'missing', data }))
    }
  }
}

function checkCallExpression (context, node) {
  const funcName = (node.callee.type === 'MemberExpression' && node.callee.property.name) || node.callee.name

  if (!/^(\$t|t|\$tc|tc)$/.test(funcName) || !node.arguments || !node.arguments.length) {
    return
  }

  const localeMessages = getLocaleMessages(context)
  if (localeMessages.isEmpty()) { return }

  const [keyNode] = node.arguments
  if (keyNode.type !== 'Literal') { return }

  const key = keyNode.value
  if (!key) {
    // TODO: should be error
    return
  }

  const missings = localeMessages.findMissingPaths(key)
  if (missings.length) {
    missings.forEach((data) => context.report({ node, messageId: 'missing', data }))
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
    schema: [],
    messages: {
      missing: "'{{path}}' does not exist in '{{locale}}'"
    }
  },
  create
}
