/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { defineTemplateBodyVisitor } from '../utils/index'
import type { RuleContext, RuleListener } from '../types'
import type { AST as VAST } from 'vue-eslint-parser'

function checkDirective(context: RuleContext, node: VAST.VDirective) {
  if (
    node.value &&
    node.value.type === 'VExpressionContainer' &&
    node.value.expression &&
    node.value.expression.type === 'Identifier'
  ) {
    const name = node.value.expression.name
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
  }
}

function checkComponent(context: RuleContext, node: VAST.VDirectiveKey) {
  const parent: VAST.VDirective = node.parent as never // typebug?
  if (
    node.name.type === 'VIdentifier' &&
    node.name.name === 'bind' &&
    node.argument &&
    node.argument.type === 'VIdentifier' &&
    node.argument.name === 'path' &&
    parent.value &&
    parent.value.type === 'VExpressionContainer' &&
    parent.value.expression &&
    parent.value.expression.type === 'Identifier'
  ) {
    const name = parent.value.expression.name
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
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

  const [keyNode] = node.arguments
  if (keyNode.type === 'Identifier') {
    const name = keyNode.name
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
  }
}

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

      'VElement:matches([name=i18n], [name=i18n-t]) > VStartTag > VAttribute[directive=true] > VDirectiveKey'(
        node: VAST.VDirectiveKey
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

export = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow localization dynamic keys at localization methods',
      category: 'Best Practices',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create
}
