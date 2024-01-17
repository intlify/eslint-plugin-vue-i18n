import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/prefer-sfc-lang-attr'
import * as vueParser from 'vue-eslint-parser'

new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module'
  }
}).run('prefer-sfc-lang-attr', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
      <i18n lang="json">{}</i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n lang="json5">{}</i18n>
      <template></template>
      <script></script>`
    },
    {
      filename: 'test.vue',
      code: `
      <i18n lang="yaml">{}</i18n>
      <template></template>
      <script></script>`
    }
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
      <i18n>{}</i18n>
      <template></template>
      <script></script>`,
      output: `
      <i18n lang="json" >{}</i18n>
      <template></template>
      <script></script>`,
      errors: [
        {
          message: '`lang` attribute is required.',
          line: 2,
          column: 7,
          endLine: 2,
          endColumn: 13
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>{}</i18n>
      <template></template>`,
      output: `
      <i18n lang="json" >{}</i18n>
      <template></template>`,
      errors: [
        {
          message: '`lang` attribute is required.',
          line: 2,
          column: 7,
          endLine: 2,
          endColumn: 13
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en" >{}</i18n>
      <template></template>
      <script></script>`,
      output: `
      <i18n locale="en" lang="json" >{}</i18n>
      <template></template>
      <script></script>`,
      errors: [
        {
          message: '`lang` attribute is required.',
          line: 2,
          column: 7,
          endLine: 2,
          endColumn: 26
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n lang>{}</i18n>
      <template></template>`,
      output: `
      <i18n lang="json">{}</i18n>
      <template></template>`,
      errors: [
        {
          message: '`lang` attribute is required.',
          line: 2,
          column: 13,
          endLine: 2,
          endColumn: 17
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n lang="">{}</i18n>
      <template></template>`,
      output: `
      <i18n lang="json">{}</i18n>
      <template></template>`,
      errors: [
        {
          message: '`lang` attribute is required.',
          line: 2,
          column: 18,
          endLine: 2,
          endColumn: 20
        }
      ]
    }
  ]
})
