/**
 * @author Yosuke Ota
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-deprecated-i18n-places-prop'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-deprecated-i18n-places-prop', rule as never, {
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
          <unknown-component path="info" tag="p" :places="{ limit: changeLimit }">
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
          <i18n path="info" tag="p" :places="{ limit: changeLimit }">
            <a place="action" :href="changeUrl">{{ $t('change') }}</a>
          </i18n>
          <!-- ... -->
        </div>
      </template>
      `,
      errors: [
        {
          message: 'Deprecated `places` prop was found. Use v-slot instead.',
          line: 5,
          column: 37
        }
      ]
    },

    {
      code: `
      <template>
        <div id="app">
          <!-- ... -->
          <i18n-t path="info" tag="p" :places="{ limit: changeLimit }">
            <a place="action" :href="changeUrl">{{ $t('change') }}</a>
          </i18n-t>
          <!-- ... -->
        </div>
      </template>
      `,
      errors: [
        {
          message: 'Deprecated `places` prop was found. Use v-slot instead.',
          line: 5,
          column: 39
        }
      ]
    }
  ]
})
