/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { defineTemplateBodyVisitor } from '../utils/index'
import type { RuleContext, RuleListener } from '../types'
import type { AST as VAST } from 'vue-eslint-parser'

function isStatic(
  node:
    | VAST.ESLintExpression
    | VAST.ESLintSpreadElement
    | VAST.VFilterSequenceExpression
    | VAST.VForExpression
    | VAST.VOnExpression
    | VAST.VSlotScopeExpression
): boolean {
  if (node.type === 'Literal') {
    return true
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return true
  }
  return false
}

function getNodeName(context: RuleContext, node: VAST.Node): string {
  if (node.type === 'Identifier') {
    return node.name
  }
  const sourceCode = context.getSourceCode()
  if (
    sourceCode.ast.range[0] <= node.range[0] &&
    node.range[1] <= sourceCode.ast.range[1]
  ) {
    return sourceCode
      .getTokens(node)
      .map(t => t.value)
      .join('')
  }
  const tokenStore = context.parserServices.getTemplateBodyTokenStore()
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
    !isStatic(node.value.expression)
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
    !isStatic(node.parent.value.expression)
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
  if (!isStatic(keyNode)) {
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
