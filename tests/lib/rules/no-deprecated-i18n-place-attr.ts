/**
 * @author Yosuke Ota
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-deprecated-i18n-place-attr'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-deprecated-i18n-place-attr', rule as never, {
  valid: [
    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <i18n path="info" tag="p">
            <template v-slot:limit>
              <span>{{ changeLimit }}</span>
            </template>
            <template v-slot:action>
              <a :href="changeUrl">{{ $t('change') }}</a>
            </template>
          </i18n>
          <!-- ... -->
        </div>
      </template>
      `
    },
    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <i18n path="info" tag="p">
            <template #limit>
              <span>{{ changeLimit }}</span>
            </template>
            <template #action>
              <a :href="changeUrl">{{ $t('change') }}</a>
            </template>
          </i18n>
          <!-- ... -->
        </div>
      </template>
      `
    },
    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <unknown-component path="info" tag="p">
            <span place="limit">{{ changeLimit }}</span>
            <a place="action" :href="changeUrl">{{ $t('change') }}</a>
          </unknown-component>
          <!-- ... -->
        </div>
      </template>
      `
    }
  ],
  invalid: [
    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <i18n path="info" tag="p">
            <span place="limit">{{ changeLimit }}</span>
            <a place="action" :href="changeUrl">{{ $t('change') }}</a>
          </i18n>
          <!-- ... -->
        </div>
      </template>
      `,
      errors: [
        {
          message:
            'Deprecated `place` attribute was found. Use v-slot instead.',
          line: 6,
          column: 19
        },
        {
          message:
            'Deprecated `place` attribute was found. Use v-slot instead.',
          line: 7,
          column: 16
        }
      ]
    },

    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <i18n-t path="info" tag="p">
            <span place="limit">{{ changeLimit }}</span>
            <a place="action" :href="changeUrl">{{ $t('change') }}</a>
          </i18n-t>
          <!-- ... -->
        </div>
      </template>
      `,
      errors: [
        {
          message:
            'Deprecated `place` attribute was found. Use v-slot instead.',
          line: 6,
          column: 19
        },
        {
          message:
            'Deprecated `place` attribute was found. Use v-slot instead.',
          line: 7,
          column: 16
        }
      ]
    },
    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <i18n path="info" tag="p" :places="{ limit: refundLimit }">
            <a place="action" :href="refundUrl">{{ $t('refund') }}</a>
          </i18n>
          <!-- ... -->
        </div>
      </template>
      `,
      errors: ['Deprecated `place` attribute was found. Use v-slot instead.']
    }
  ]
})
