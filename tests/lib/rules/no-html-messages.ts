/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { createRequire } from 'node:module'
import { RuleTester } from 'eslint'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs'
import rule from '../../../lib/rules/no-html-messages'
import { getTestCasesFromFixtures } from '../test-utils'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const cwdRoot = join(__dirname, '../../fixtures/no-html-messages')

new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
}).run('no-html-messages', rule as never, {
  valid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n>${fs.readFileSync(
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
      code: `<i18n>${fs.readFileSync(
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
      code: `<i18n lang="yaml">${fs.readFileSync(
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
