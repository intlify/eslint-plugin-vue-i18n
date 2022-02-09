import { RuleTester } from 'eslint'
import rule = require('../../../lib/rules/sfc-locale-attr')
const vueParser = require.resolve('vue-eslint-parser')

const tester = new RuleTester({
  parser: vueParser,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
})

tester.run('sfc-locale-attr', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "message": "hello!"
      }
      </i18n>
      `
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "message": "hello!"
      }
      </i18n>
      `,
      options: ['always']
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en": {
          "message": "hello!"
        }
      }
      </i18n>
      `,
      options: ['never']
    }
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en": {
          "message": "hello!"
        }
      }
      </i18n>
      `,
      errors: [
        {
          message: '`locale` attribute is required.',
          line: 2,
          column: 7
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en": {
          "message": "hello!"
        }
      }
      </i18n>
      `,
      options: ['always'],
      errors: [
        {
          message: '`locale` attribute is required.',
          line: 2,
          column: 7
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {
        "en": {
          "message": "hello!"
        }
      }
      </i18n>
      `,
      options: ['never'],
      errors: [
        {
          message: '`locale` attribute is disallowed.',
          line: 2,
          column: 13
        }
      ]
    }
  ]
})
