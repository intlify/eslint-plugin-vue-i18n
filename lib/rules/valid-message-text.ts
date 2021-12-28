import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { RuleContext, RuleListener } from '../types'
import type { LocaleMessage } from '../utils/locale-messages'
import { joinPath } from '../utils/key-path'
const debug = debugBuilder('eslint-plugin-vue-i18n:valid-message-text')

type Locale = string
type ValidatorPath = string

interface Validator {
  (text: string): [boolean, string]
}

const getValidators = (
  settings: Record<Locale, ValidatorPath[]>
): Record<Locale, Validator[]> => {
  const validators: Record<Locale, Validator[]> = {}

  for (const locale in settings) {
    validators[locale] = settings[locale].map(path => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fn = require(path)

      if (typeof fn === 'function') {
        return fn
      }

      throw new Error(
        `Module in path "${path}" does not contain validation function`
      )
    })
  }

  return validators
}

function isLeafMessageNode(
  node:
    | JSONAST.JSONExpression
    | YAMLAST.YAMLContent
    | YAMLAST.YAMLWithMeta
    | null
): boolean {
  if (node == null) {
    // null is considered to be a branch, considering the possibility of being described.
    return false
  }
  if (node.type === 'JSONLiteral') {
    // null is considered to be a branch, considering the possibility of being described.
    return !(node.value == null && node.regex == null && node.bigint == null)
  }
  if (node.type === 'JSONIdentifier' || node.type === 'JSONTemplateLiteral') {
    return true
  }
  if (node.type === 'JSONUnaryExpression') {
    return isLeafMessageNode(node.argument)
  }
  if (node.type === 'YAMLScalar') {
    // null is considered to be a branch, considering the possibility of being described.
    return node.value != null
  }
  if (node.type === 'YAMLWithMeta') {
    return isLeafMessageNode(node.value)
  }
  return node.type === 'YAMLAlias'
}

function getMessage<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
  node: N
): string {
  if (node.type === 'JSONLiteral' && typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'YAMLScalar' && typeof node.value === 'string') {
    return node.value
  }

  throw new Error('Incorrect node')
}

function create(context: RuleContext): RuleListener {
  const filename = context.getFilename()
  const validators = getValidators(context.options[0]?.validators)

  function reportErrors(
    keyPath: (string | number)[],
    errors: string[],
    reportNode: JSONAST.JSONNode | YAMLAST.YAMLNode
  ) {
    context.report({
      message: "'{{path}}' contains following errors: {{errors}}",
      data: {
        path: joinPath(...keyPath),
        errors: errors.join(', ')
      },
      loc: reportNode.loc
    })
  }

  function createVerifyContext<N extends JSONAST.JSONNode | YAMLAST.YAMLNode>(
    targetLocaleMessage: LocaleMessage
  ) {
    type KeyStack =
      | {
          locale: null
          node?: N
          upper?: KeyStack
        }
      | {
          locale: string
          node?: N
          upper?: KeyStack
          keyPath: (string | number)[]
        }
    let keyStack: KeyStack
    if (targetLocaleMessage.isResolvedLocaleByFileName()) {
      const locale = targetLocaleMessage.locales[0]
      keyStack = {
        locale,
        keyPath: []
      }
    } else {
      keyStack = {
        locale: null
      }
    }

    // localeMessages.locales
    return {
      enterKey(
        key: string | number,
        node: N,
        value:
          | JSONAST.JSONExpression
          | YAMLAST.YAMLContent
          | YAMLAST.YAMLWithMeta
          | null
      ) {
        if (keyStack.locale == null) {
          const locale = key as string
          keyStack = {
            node,
            locale,
            keyPath: [],
            upper: keyStack
          }
        } else {
          const keyPath = [...keyStack.keyPath, key]

          if (value && isLeafMessageNode(value)) {
            const text = getMessage(value)
            const errors = (validators[keyStack.locale] || [])
              .map(v => v(text))
              .filter(([valid]) => !valid)
              .map(([, error]) => error)

            if (errors.length > 0) {
              reportErrors(keyPath, errors as string[], value)
            }
          }

          keyStack = {
            node,
            locale: keyStack.locale,
            keyPath,
            upper: keyStack
          }
        }
      },
      leaveKey(node: N | null) {
        if (keyStack.node === node) {
          keyStack = keyStack.upper!
        }
      }
    }
  }

  /**
   * Create node visitor for JSON
   */
  function createVisitorForJson(
    targetLocaleMessage: LocaleMessage
  ): RuleListener {
    const ctx = createVerifyContext(targetLocaleMessage)
    return {
      JSONProperty(node: JSONAST.JSONProperty) {
        const key =
          node.key.type === 'JSONLiteral' ? `${node.key.value}` : node.key.name

        ctx.enterKey(key, node.key, node.value)
      },
      'JSONProperty:exit'(node: JSONAST.JSONProperty) {
        ctx.leaveKey(node.key)
      },
      'JSONArrayExpression > *'(
        node: JSONAST.JSONArrayExpression['elements'][number] & {
          parent: JSONAST.JSONArrayExpression
        }
      ) {
        const key = node.parent.elements.indexOf(node)
        ctx.enterKey(key, node, node)
      },
      'JSONArrayExpression > *:exit'(
        node: JSONAST.JSONArrayExpression['elements'][number]
      ) {
        ctx.leaveKey(node)
      }
    }
  }

  /**
   * Create node visitor for YAML
   */
  function createVisitorForYaml(
    targetLocaleMessage: LocaleMessage
  ): RuleListener {
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

    const ctx = createVerifyContext(targetLocaleMessage)

    return {
      YAMLPair(node: YAMLAST.YAMLPair) {
        if (node.key != null) {
          if (withinKey(node)) {
            return
          }
          yamlKeyNodes.add(node.key)
        }

        if (node.key != null && node.key.type === 'YAMLScalar') {
          const key = String(node.key.value)

          ctx.enterKey(key, node.key, node.value)
        }
      },
      'YAMLPair:exit'(node: YAMLAST.YAMLPair) {
        if (node.key != null) {
          ctx.leaveKey(node.key)
        }
      },
      'YAMLSequence > *'(
        node: YAMLAST.YAMLSequence['entries'][number] & {
          parent: YAMLAST.YAMLSequence
        }
      ) {
        if (withinKey(node)) {
          return
        }
        const key = node.parent.entries.indexOf(node)
        ctx.enterKey(key, node, node)
      },
      'YAMLSequence > *:exit'(node: YAMLAST.YAMLSequence['entries'][number]) {
        ctx.leaveKey(node)
      }
    }
  }

  if (extname(filename) === '.vue') {
    return defineCustomBlocksVisitor(
      context,
      ctx => {
        const localeMessages = getLocaleMessages(context)
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        return createVisitorForJson(targetLocaleMessage)
      },
      ctx => {
        const localeMessages = getLocaleMessages(context)
        const targetLocaleMessage = localeMessages.findBlockLocaleMessage(
          ctx.parserServices.customBlock
        )
        if (!targetLocaleMessage) {
          return {}
        }
        return createVisitorForYaml(targetLocaleMessage)
      }
    )
  } else if (context.parserServices.isJSON || context.parserServices.isYAML) {
    const localeMessages = getLocaleMessages(context)
    const targetLocaleMessage = localeMessages.findExistLocaleMessage(filename)
    if (!targetLocaleMessage) {
      debug(`ignore ${filename} in valid-message-text`)
      return {}
    }

    if (context.parserServices.isJSON) {
      return createVisitorForJson(targetLocaleMessage)
    } else if (context.parserServices.isYAML) {
      return createVisitorForYaml(targetLocaleMessage)
    }
    return {}
  } else {
    debug(`ignore ${filename} in valid-message-text`)
    return {}
  }
}

export = {
  meta: {
    type: 'layout',
    docs: {
      description: 'disallow invalid message text',
      category: 'Misc',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          validators: {
            type: 'object',
            patternProperties: {
              '^([a-zA-Z]{2,}[_-]{0,1}[a-zA-Z]*)$': {
                type: 'array',
                items: { type: 'string' },
                uniqueItems: true
              }
            },
            additionalProperties: false
          }
        }
      }
    ]
  },
  create
}
