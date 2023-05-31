/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import {
  defineTemplateBodyVisitor,
  getLocaleMessages,
  getStaticLiteralValue,
  isStaticLiteral,
  compositingVisitors
} from '../utils/index'
import type { AST as VAST } from 'vue-eslint-parser'
import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'

function create(context: RuleContext): RuleListener {
  return compositingVisitors(
    defineTemplateBodyVisitor(context, {
      "VAttribute[directive=true][key.name='t']"(node: VAST.VDirective) {
        checkDirective(context, node)
      },

      "VAttribute[directive=true][key.name.name='t']"(node: VAST.VDirective) {
        checkDirective(context, node)
      },

      ["VElement:matches([name=i18n], [name=i18n-t]) > VStartTag > VAttribute[key.name='path']," +
        "VElement[name=i18n-t] > VStartTag > VAttribute[key.name='keypath']"](
        node: VAST.VAttribute
      ) {
        checkComponent(context, node)
      },

      CallExpression(node: VAST.ESLintCallExpression) {
        checkCallExpression(context, node)
      }
    }),
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
    isStaticLiteral(node.value.expression)
  ) {
    const key = getStaticLiteralValue(node.value.expression)
    if (!key) {
      // TODO: should be error
      return
    }
    const missingPath = localeMessages.findMissingPath(String(key))
    if (missingPath) {
      context.report({
        node,
        messageId: 'missing',
        data: { path: missingPath }
      })
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
    const missingPath = localeMessages.findMissingPath(key)
    if (missingPath) {
      context.report({
        node,
        messageId: 'missing',
        data: { path: missingPath }
      })
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
  if (!isStaticLiteral(keyNode)) {
    return
  }

  const key = getStaticLiteralValue(keyNode)
  if (!key) {
    // TODO: should be error
    return
  }

  const missingPath = localeMessages.findMissingPath(String(key))
  if (missingPath) {
    context.report({ node, messageId: 'missing', data: { path: missingPath } })
  }
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow missing locale message key at localization methods',
      category: 'Recommended',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-missing-keys.html',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      missing: "'{{path}}' does not exist in localization message resources"
    }
  },
  create
})
