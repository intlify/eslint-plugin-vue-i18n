/**
 * @author Jernej Barbaric
 */
import { extname } from 'path'
import { defineCustomBlocksVisitor, getLocaleMessages } from '../utils/index'
import debugBuilder from 'debug'
import type { AST as JSONAST } from 'jsonc-eslint-parser'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'
import { getFilename, getSourceCode } from '../utils/compat'

const debug = debugBuilder('eslint-plugin-vue-i18n:valid-plural-forms')

function create(context: RuleContext): RuleListener {
  const filename = getFilename(context)
  const sourceCode = getSourceCode(context)
  const options = context.options[0] || {}
  const pluralFormCounts: Record<string, number[]> =
    options.pluralFormCounts || {}

  function getLocale(): string | null {
    const localeMessages = getLocaleMessages(context, {
      ignoreMissingSettingsError: true
    })
    return localeMessages.findExistLocaleMessage(filename)?.locales[0] || null
  }

  function verifyPluralForms(
    message: unknown,
    node: JSONAST.JSONLiteral | YAMLAST.YAMLScalar
  ) {
    if (typeof message !== 'string' || !message.includes('|')) {
      return
    }
    const locale = getLocale()
    if (!locale) {
      return
    }
    const allowedCounts = pluralFormCounts[locale] || [2, 3]
    const formCount = message.split('|').length
    if (!allowedCounts.includes(formCount)) {
      context.report({
        loc: node.loc,
        message: `Expected ${allowedCounts.join(' or ')} plural forms for locale '${locale}', but found ${formCount}`
      })
    }
  }

  function verifyJSONLiteral(node: JSONAST.JSONLiteral) {
    const parent = node.parent!
    if (parent.type === 'JSONProperty' && parent.key === node) {
      return
    }
    verifyPluralForms(node.value, node)
  }

  function verifyYAMLScalar(node: YAMLAST.YAMLScalar) {
    const parent = node.parent
    if (parent.type === 'YAMLPair' && parent.key === node) {
      return
    }
    verifyPluralForms(node.value, node)
  }

  if (extname(filename) === '.vue') {
    return defineCustomBlocksVisitor(
      context,
      () => ({ JSONLiteral: verifyJSONLiteral }),
      () => ({ YAMLScalar: verifyYAMLScalar })
    )
  } else if (sourceCode.parserServices.isJSON) {
    if (!getLocaleMessages(context).findExistLocaleMessage(filename)) {
      return {}
    }
    return { JSONLiteral: verifyJSONLiteral }
  } else if (sourceCode.parserServices.isYAML) {
    if (!getLocaleMessages(context).findExistLocaleMessage(filename)) {
      return {}
    }
    return { YAMLScalar: verifyYAMLScalar }
  } else {
    debug(`ignore ${filename} in valid-plural-forms`)
    return {}
  }
}

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'enforce valid plural form counts for each locale to prevent runtime errors',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/valid-plural-forms.html',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          pluralFormCounts: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'integer', minimum: 1 },
              minItems: 1
            }
          }
        },
        additionalProperties: false
      }
    ]
  },
  create
})
