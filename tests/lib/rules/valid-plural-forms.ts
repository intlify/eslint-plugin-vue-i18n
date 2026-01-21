/**
 * @author Jernej Barbaric
 */
import { join } from 'node:path'
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/valid-plural-forms'
import * as vueParser from 'vue-eslint-parser'
import * as jsonParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

const localesRoot = join(__dirname, '../../fixtures/valid-plural-forms')

const ruleOptions = [
  {
    pluralFormCounts: {
      en: [2],
      sl: [2, 4],
      'sr-latn': [2, 3]
    }
  }
]

const settings = {
  'vue-i18n': {
    localeDir: `${localesRoot}/*.{json,yaml,yml}`
  }
}

const json = (locale: string) => ({
  languageOptions: { parser: jsonParser },
  filename: join(localesRoot, `${locale}.json`),
  settings
})

const yaml = (locale: string) => ({
  languageOptions: { parser: yamlParser },
  filename: join(localesRoot, `${locale}.yaml`),
  settings
})

const vue = {
  languageOptions: { parser: vueParser },
  filename: join(localesRoot, 'test.vue'),
  settings
}

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('valid-plural-forms', rule as never, {
  valid: [
    // JSON: Valid Slovenian with 4 forms (full)
    {
      code: `{ "valid": "ena | dve | tri | štiri" }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Valid Slovenian with 2 forms (binary)
    {
      code: `{ "binary": "ena | več" }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Non-plural message (no pipe) - always valid
    {
      code: `{ "simple": "Simple message without plural" }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: English with 2 forms
    {
      code: `{ "valid": "one | many" }`,
      options: ruleOptions,
      ...json('en')
    },
    // JSON: Serbian with 3 forms (full)
    {
      code: `{ "valid": "jedan | dva | više" }`,
      options: ruleOptions,
      ...json('sr-latn')
    },
    // JSON: Serbian with 2 forms (binary)
    {
      code: `{ "binary": "jedan | više" }`,
      options: ruleOptions,
      ...json('sr-latn')
    },
    // JSON: No rule options - uses default [2, 3]
    {
      code: `{ "binary": "one | many", "ternary": "zero | one | many" }`,
      options: [],
      ...json('sl')
    },
    // JSON: Locale not in config - uses default [2, 3]
    {
      code: `{ "binary": "one | many", "ternary": "zero | one | many" }`,
      options: [{ pluralFormCounts: { de: [4] } }],
      ...json('sl')
    },
    // JSON: Nested objects - valid plural forms
    {
      code: `{ "nested": { "deep": { "message": "ena | dve | tri | štiri" } } }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Arrays - valid plural forms
    {
      code: `{ "items": ["ena | več", "ena | dve | tri | štiri"] }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Whitespace around pipes - valid
    {
      code: `{ "spaced": "ena   |   dve   |   tri   |   štiri" }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Single form (no pipe) - always valid (not a plural)
    {
      code: `{ "single": "Just one message" }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Empty string - valid (not a plural)
    {
      code: `{ "empty": "" }`,
      options: ruleOptions,
      ...json('sl')
    },
    // JSON: Locale-specific overrides default
    {
      code: `{ "valid": "ena | dve | tri | štiri" }`,
      options: [{ pluralFormCounts: { sl: [2, 4] } }],
      ...json('sl')
    },
    // YAML: Valid Slovenian with 4 forms
    {
      code: `valid: "ena | dve | tri | štiri"`,
      options: ruleOptions,
      ...yaml('sl')
    },
    // YAML: Valid Slovenian with 2 forms (binary)
    {
      code: `binary: "ena | več"`,
      options: ruleOptions,
      ...yaml('sl')
    },
    // Vue SFC with JSON: Valid locale attribute
    {
      code: `
      <i18n locale="sl">
      { "valid": "ena | dve | tri | štiri" }
      </i18n>`,
      options: ruleOptions,
      ...vue
    },
    // Vue SFC with YAML: Binary is valid
    {
      code: `
      <i18n lang="yaml" locale="sl">
binary: "ena | več"
      </i18n>`,
      options: ruleOptions,
      ...vue
    }
  ],

  invalid: [
    // JSON: Slovenian - 3 forms invalid (needs 2 or 4)
    {
      code: `{ "invalid": "ena | dve | tri" }`,
      options: ruleOptions,
      ...json('sl'),
      errors: [
        { message: "Expected 2 or 4 plural forms for locale 'sl', but found 3" }
      ]
    },
    // JSON: Slovenian - 5 forms invalid
    {
      code: `{ "tooMany": "ena | dve | tri | štiri | pet" }`,
      options: ruleOptions,
      ...json('sl'),
      errors: [
        { message: "Expected 2 or 4 plural forms for locale 'sl', but found 5" }
      ]
    },
    // JSON: English - 3 forms invalid (needs exactly 2)
    {
      code: `{ "invalid": "one | two | three" }`,
      options: ruleOptions,
      ...json('en'),
      errors: [
        { message: "Expected 2 plural forms for locale 'en', but found 3" }
      ]
    },
    // JSON: Serbian - 4 forms invalid (needs 2 or 3)
    {
      code: `{ "invalid": "jedan | dva | tri | četiri" }`,
      options: ruleOptions,
      ...json('sr-latn'),
      errors: [
        {
          message:
            "Expected 2 or 3 plural forms for locale 'sr-latn', but found 4"
        }
      ]
    },
    // JSON: Multiple errors in same file
    {
      code: `
      {
        "valid": "ena | dve | tri | štiri",
        "invalid1": "ena | dve | tri",
        "invalid2": "ena | dve | tri | štiri | pet"
      }`,
      options: ruleOptions,
      ...json('sl'),
      errors: [
        {
          message: "Expected 2 or 4 plural forms for locale 'sl', but found 3",
          line: 4
        },
        {
          message: "Expected 2 or 4 plural forms for locale 'sl', but found 5",
          line: 5
        }
      ]
    },
    // YAML: Slovenian - 3 forms invalid
    {
      code: `invalid: "ena | dve | tri"`,
      options: ruleOptions,
      ...yaml('sl'),
      errors: [
        { message: "Expected 2 or 4 plural forms for locale 'sl', but found 3" }
      ]
    },
    // Vue SFC with JSON: Invalid plural forms
    {
      code: `
      <i18n locale="sl">
      { "invalid": "ena | dve | tri" }
      </i18n>`,
      options: ruleOptions,
      ...vue,
      errors: [
        {
          message: "Expected 2 or 4 plural forms for locale 'sl', but found 3",
          line: 3
        }
      ]
    },
    // Vue SFC with YAML: Invalid plural forms
    {
      code: `
      <i18n lang="yaml" locale="sl">
invalid: "ena | dve | tri"
      </i18n>`,
      options: ruleOptions,
      ...vue,
      errors: [
        {
          message: "Expected 2 or 4 plural forms for locale 'sl', but found 3",
          line: 3
        }
      ]
    },
    // JSON: Nested objects - invalid plural forms
    {
      code: `{ "nested": { "deep": { "message": "ena | dve | tri" } } }`,
      options: ruleOptions,
      ...json('sl'),
      errors: [
        { message: "Expected 2 or 4 plural forms for locale 'sl', but found 3" }
      ]
    },
    // JSON: Arrays - invalid plural forms
    {
      code: `{ "items": ["ena | dve | tri"] }`,
      options: ruleOptions,
      ...json('sl'),
      errors: [
        { message: "Expected 2 or 4 plural forms for locale 'sl', but found 3" }
      ]
    },
    // JSON: Built-in default [2, 3] - invalid with 4 forms
    {
      code: `{ "invalid": "one | two | three | four" }`,
      options: [],
      ...json('sl'),
      errors: [
        { message: "Expected 2 or 3 plural forms for locale 'sl', but found 4" }
      ]
    }
  ]
})
