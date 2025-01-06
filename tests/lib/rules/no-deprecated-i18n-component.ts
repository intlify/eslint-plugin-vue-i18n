/**
 * @author Yosuke Ota
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-deprecated-i18n-component'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-deprecated-i18n-component', rule as never, {
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
        <i18n-t keypath="info" tag="p">
          <template #limit>
            <span>{{ refundLimit }}</span>
          <template>
          <template #action>
            <a :href="refundUrl">{{ $t('refund') }}</a>
          <template>
        </i18n-t>
      </template>
      `
    },
    {
      code: `
      <i18n>{}<i18n>
      <template>
      </template>
      `
    }
  ],

  invalid: [
    {
      code: `
      <template>
        <i18n path="message.greeting" />
      </template>
      `,
      output: `
      <template>
        <i18n-t keypath="message.greeting" tag="span" />
      </template>
      `,
      errors: [
        {
          message:
            'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.',
          line: 3,
          column: 9
        }
      ]
    },
    {
      code: `
      <template>
        <i18n path="message.greeting" tag="div" />
      </template>
      `,
      output: `
      <template>
        <i18n-t keypath="message.greeting" tag="div" />
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n :tag="false" path="message.greeting">
          <span>hello!</span>
        </i18n>
      </template>
      `,
      output: `
      <template>
        <i18n-t  keypath="message.greeting">
          <span>hello!</span>
        </i18n-t>
      </template>
      `,
      errors: [
        {
          message:
            'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.',
          line: 3,
          column: 9
        }
      ]
    },
    {
      code: `
      <template>
        <i18n path="message.greeting" :tag="false" >
          <span>hello!</span>
        </i18n>
      </template>
      `,
      output: `
      <template>
        <i18n-t keypath="message.greeting"  >
          <span>hello!</span>
        </i18n-t>
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n path="message.greeting">
          <span>hello!</span>
        </i18n>
      </template>
      `,
      output: `
      <template>
        <i18n-t keypath="message.greeting" tag="span">
          <span>hello!</span>
        </i18n-t>
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n tag="div" path="message.greeting">
          <span>hello!</span>
        </i18n>
      </template>
      `,
      output: `
      <template>
        <i18n-t tag="div" keypath="message.greeting">
          <span>hello!</span>
        </i18n-t>
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n/>
      </template>
      `,
      output: `
      <template>
        <i18n-t tag="span"/>
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n :path="messageKey" />
      </template>
      `,
      output: `
      <template>
        <i18n-t :keypath="messageKey" tag="span" />
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n v-bind:path="messageKey" />
      </template>
      `,
      output: `
      <template>
        <i18n-t v-bind:keypath="messageKey" tag="span" />
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n
          v-if="shown"
          v-on:path="handle"
          v-bind:foo="fakeMessageKey"
          v-bind:[path]="fakeMessageKey"
          v-bind:path="messageKey"
        />
      </template>
      `,
      output: `
      <template>
        <i18n-t
          v-if="shown"
          v-on:path="handle"
          v-bind:foo="fakeMessageKey"
          v-bind:[path]="fakeMessageKey"
          v-bind:keypath="messageKey" tag="span"
        />
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    },
    {
      code: `
      <template>
        <i18n :tag="true"/>
      </template>
      `,
      output: `
      <template>
        <i18n-t tag="span"/>
      </template>
      `,
      errors: [
        'Deprecated <i18n> component was found. For VueI18n v9.0, use <i18n-t> component instead.'
      ]
    }
  ]
})
