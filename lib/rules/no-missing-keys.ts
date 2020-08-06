/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { defineTemplateBodyVisitor, getLocaleMessages } from '../utils/index'
import type { AST as VAST } from 'vue-eslint-parser'
import type { RuleContext, RuleListener } from '../types'

function create(context: RuleContext): RuleListener {
  return defineTemplateBodyVisitor(
    context,
    {
      "VAttribute[directive=true][key.name='t']"(node: VAST.VDirective) {
        checkDirective(context, node)
      },

      "VAttribute[directive=true][key.name.name='t']"(node: VAST.VDirective) {
        checkDirective(context, node)
      },

      "VElement:matches([name=i18n], [name=i18n-t]) > VStartTag > VAttribute[key.name='path']"(
        node: VAST.VAttribute
      ) {
        checkComponent(context, node)
      },

      "VElement:matches([name=i18n], [name=i18n-t]) > VStartTag > VAttribute[key.name.name='path']"(
        node: VAST.VAttribute
      ) {
        checkComponent(context, node)
      },

      CallExpression(node: VAST.ESLintCallExpression) {
        checkCallExpression(context, node)
      }
    },
    {
      CallExpression(node: VAST.ESLintCallExpression) {
        checkCallExpression(context, node)
      }
    }
  )
}

function checkDirective(context: RuleContext, node: VAST.VDirective) {
  const localeMessages = getLocaleMessages(context)
  if (localeMessages.isEmpty()) {
    return
  }
  if (
    node.value &&
    node.value.type === 'VExpressionContainer' &&
    node.value.expression &&
    node.value.expression.type === 'Literal'
  ) {
    const key = node.value.expression.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = localeMessages.findMissingPaths(String(key))
    if (missings.length) {
      missings.forEach(data =>
        context.report({ node, messageId: 'missing', data })
      )
    }
  }
}

function checkComponent(context: RuleContext, node: VAST.VAttribute) {
  const localeMessages = getLocaleMessages(context)
  if (localeMessages.isEmpty()) {
    return
  }
  if (node.value && node.value.type === 'VLiteral') {
    const key = node.value.value
    if (!key) {
      // TODO: should be error
      return
    }
    const missings = localeMessages.findMissingPaths(key)
    if (missings.length) {
      missings.forEach(data =>
        context.report({ node, messageId: 'missing', data })
      )
    }
  }
}

function checkCallExpression(
  context: RuleContext,
  node: VAST.ESLintCallExpression
) {
  const funcName =
    (node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name) ||
    (node.callee.type === 'Identifier' && node.callee.name) ||
    ''

  if (
    !/^(\$t|t|\$tc|tc)$/.test(funcName) ||
    !node.arguments ||
    !node.arguments.length
  ) {
    return
  }

  const localeMessages = getLocaleMessages(context)
  if (localeMessages.isEmpty()) {
    return
  }

  const [keyNode] = node.arguments
  if (keyNode.type !== 'Literal') {
    return
  }

  const key = keyNode.value
  if (!key) {
    // TODO: should be error
    return
  }

  const missings = localeMessages.findMissingPaths(String(key))
  if (missings.length) {
    missings.forEach(data =>
      context.report({ node, messageId: 'missing', data })
    )
  }
}

export = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow missing locale message key at localization methods',
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
