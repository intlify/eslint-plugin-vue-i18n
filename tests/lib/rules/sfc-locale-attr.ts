import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/sfc-locale-attr'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
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
