/**
 * @author Yosuke Ota
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-i18n-t-path-prop'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-i18n-t-path-prop', rule as never, {
  valid: [
    {
      code: `
      <template>
        <i18n-t keypath="message.greeting" />
      </template>
      `
    },
    {
      code: `
      <template>
        <i18n path="message.greeting" />
      </template>
      `
    }
  ],
  invalid: [
    {
      code: `
      <template>
        <i18n-t path="message.greeting" />
      </template>
      `,
      output: `
      <template>
        <i18n-t keypath="message.greeting" />
      </template>
      `,
      errors: [
        {
          message:
            'Cannot use `path` prop with `<i18n-t>` component. Use `keypath` prop instead.',
          line: 3,
          column: 17
        }
      ]
    },
    {
      code: `
      <template>
        <i18n-t :path="messageKey" />
      </template>
      `,
      output: `
      <template>
        <i18n-t :keypath="messageKey" />
      </template>
      `,
      errors: [
        {
          message:
            'Cannot use `path` prop with `<i18n-t>` component. Use `keypath` prop instead.',
          line: 3,
          column: 17
        }
      ]
    },
    {
      code: `
      <template>
        <i18n-t v-bind:path="messageKey" />
      </template>
      `,
      output: `
      <template>
        <i18n-t v-bind:keypath="messageKey" />
      </template>
      `,
      errors: [
        {
          message:
            'Cannot use `path` prop with `<i18n-t>` component. Use `keypath` prop instead.',
          line: 3,
          column: 17
        }
      ]
    }
  ]
})
