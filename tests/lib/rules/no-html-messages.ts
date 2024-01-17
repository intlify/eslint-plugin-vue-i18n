/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from '../eslint-compat'
import { join } from 'node:path'
import { readFileSync } from 'fs'
import rule from '../../../lib/rules/no-html-messages'
import { getTestCasesFromFixtures } from '../test-utils'
import * as vueParser from 'vue-eslint-parser'

const cwdRoot = join(__dirname, '../../fixtures/no-html-messages')

new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2015,
    sourceType: 'module'
  }
}).run('no-html-messages', rule as never, {
  valid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n>${readFileSync(
        require.resolve('../../fixtures/no-html-messages/valid/en.json'),
        'utf8'
      )}</i18n>
    <template></template><script></script>`
    },
    {
      // unuse i18n sfc
      filename: 'test.vue',
      code: `
    <template>
      <div id="app"></div>
    </template>
    <script>
    export default {
      created () {
      }
    }
    </script>`
    },
    ...getTestCasesFromFixtures({
      cwd: join(cwdRoot, './valid'),
      localeDir: `*.{json,yaml,yml}`
    })
  ],
  invalid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n>${readFileSync(
        require.resolve('../../fixtures/no-html-messages/invalid/en.json'),
        'utf8'
      )}</i18n>
    <template></template><script></script>`,
      errors: [
        {
          message: 'used HTML localization message',
          line: 3,
          column: 14
        },
        {
          message: 'used HTML localization message',
          line: 5,
          column: 24
        },
        {
          message: 'used HTML localization message',
          line: 6,
          column: 22
        }
      ]
    },
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n lang="yaml">${readFileSync(
        require.resolve('../../fixtures/no-html-messages/invalid/en.yaml'),
        'utf8'
      )}</i18n>
    <template></template><script></script>`,
      errors: [
        {
          message: 'used HTML localization message',
          line: 2,
          column: 12
        },
        {
          message: 'used HTML localization message',
          line: 4,
          column: 22
        },
        {
          message: 'used HTML localization message',
          line: 5,
          column: 20
        }
      ]
    },

    ...getTestCasesFromFixtures(
      {
        cwd: join(cwdRoot, './invalid'),
        localeDir: `*.{json,yaml,yml}`
      },
      {
        'en.json': {
          errors: [
            {
              line: 3,
              message: 'used HTML localization message'
            },
            {
              line: 5,
              message: 'used HTML localization message'
            },
            {
              line: 6,
              message: 'used HTML localization message'
            }
          ]
        },
        'en.yaml': {
          errors: [
            {
              line: 2,
              message: 'used HTML localization message'
            },
            {
              line: 4,
              message: 'used HTML localization message'
            },
            {
              line: 5,
              message: 'used HTML localization message'
            }
          ]
        }
      }
    )
  ]
})
