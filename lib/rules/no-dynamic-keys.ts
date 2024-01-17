/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { defineTemplateBodyVisitor, isStaticLiteral } from '../utils/index'
import type { RuleContext, RuleListener } from '../types'
import type { AST as VAST } from 'vue-eslint-parser'
import { createRule } from '../utils/rule'
import { getSourceCode } from '../utils/compat'

function getNodeName(context: RuleContext, node: VAST.Node): string {
  if (node.type === 'Identifier') {
    return node.name
  }
  const sourceCode = getSourceCode(context)
  if (
    sourceCode.ast.range[0] <= node.range[0] &&
    node.range[1] <= sourceCode.ast.range[1]
  ) {
    return sourceCode
      .getTokens(node)
      .map(t => t.value)
      .join('')
  }
  const tokenStore = sourceCode.parserServices.getTemplateBodyTokenStore()
  return tokenStore
    .getTokens(node)
    .map(t => t.value)
    .join('')
}

function checkDirective(context: RuleContext, node: VAST.VDirective) {
  if (
    node.value &&
    node.value.type === 'VExpressionContainer' &&
    node.value.expression &&
    !isStaticLiteral(node.value.expression)
  ) {
    const name = getNodeName(context, node.value.expression)
    context.report({
      node,
      message: `'${name}' dynamic key is used'`
    })
  }
}

function checkComponent(context: RuleContext, node: VAST.VDirectiveKey) {
  if (
    node.name.type === 'VIdentifier' &&
    node.name.name === 'bind' &&
    node.argument &&
    node.argument.type === 'VIdentifier' &&
    node.argument.name === 'path' &&
    node.parent.value &&
    node.parent.value.type === 'VExpressionContainer' &&
    node.parent.value.expression &&
    !isStaticLiteral(node.parent.value.expression)
  ) {
    const name = getNodeName(context, node.parent.value.expression)
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
  if (!isStaticLiteral(keyNode)) {
    const name = getNodeName(context, keyNode)
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

export = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow localization dynamic keys at localization methods',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/no-dynamic-keys.html',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create
})
