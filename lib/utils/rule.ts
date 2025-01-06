import type { RuleModule, RuleListener } from '../types'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { CustomBlockVisitorFactory } from '../types/vue-parser-services'
import { getReportIndex } from '../utils/message-compiler/utils'

export type GetReportOffset = (offset: number) => number | null
export type VerifyMessage = (
  message: string,
  reportNode: JSONAST.JSONStringLiteral | YAMLAST.YAMLScalar,
  getReportOffset: GetReportOffset
) => void

export function createRule(module: RuleModule) {
  return module
}

/**
 * Define create node visitor for JSON
 */
export function defineCreateVisitorForJson(
  verifyMessage: VerifyMessage
): CustomBlockVisitorFactory {
  return function (): RuleListener {
    function verifyExpression(node: JSONAST.JSONExpression) {
      if (node.type !== 'JSONLiteral' || typeof node.value !== 'string') {
        return
      }
      verifyMessage(node.value, node as JSONAST.JSONStringLiteral, offset =>
        getReportIndex(node, offset)
      )
    }
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        verifyExpression(node.value)
      },
      JSONArrayExpression(node: JSONAST.JSONArrayExpression) {
        for (const element of node.elements) {
          if (element) verifyExpression(element)
        }
      }
    }
  }
}

/**
 * Define Create node visitor for YAML
 */
export function defineCreateVisitorForYaml(
  verifyMessage: VerifyMessage
): CustomBlockVisitorFactory {
  return function (): RuleListener {
    const yamlKeyNodes = new Set<YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta>()
    function withinKey(node: YAMLAST.YAMLNode) {
      for (const keyNode of yamlKeyNodes) {
        if (
          keyNode.range[0] <= node.range[0] &&
          node.range[0] < keyNode.range[1]
        ) {
          return true
        }
      }
      return false
    }
    function verifyContent(node: YAMLAST.YAMLContent | YAMLAST.YAMLWithMeta) {
      const valueNode = node.type === 'YAMLWithMeta' ? node.value : node
      if (
        !valueNode ||
        valueNode.type !== 'YAMLScalar' ||
        typeof valueNode.value !== 'string'
      ) {
        return
      }
      verifyMessage(valueNode.value, valueNode, offset =>
        getReportIndex(valueNode, offset)
      )
    }
    return {
      YAMLPair(node: YAMLAST.YAMLPair) {
        if (withinKey(node)) {
          return
        }
        if (node.key != null) {
          yamlKeyNodes.add(node.key)
        }

        if (node.value) verifyContent(node.value)
      },
      YAMLSequence(node: YAMLAST.YAMLSequence) {
        if (withinKey(node)) {
          return
        }
        for (const entry of node.entries) {
          if (entry) verifyContent(entry)
        }
      }
    }
  }
}
