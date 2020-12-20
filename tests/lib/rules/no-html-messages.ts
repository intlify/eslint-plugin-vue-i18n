/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from 'eslint'
import { join } from 'path'
import fs from 'fs'
import rule = require('../../../lib/rules/no-html-messages')
import { testOnFixtures } from '../test-utils'

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
    }
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
    }
  ]
})

describe('no-html-messages with fixtures', () => {
  const cwdRoot = join(__dirname, '../../fixtures/no-html-messages')

  describe('valid', () => {
    it('should be not detected html messages', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './valid'),
          localeDir: `*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-html-messages'
        },
        {}
      )
    })
  })

  describe('invalid', () => {
    it('should be detected html messages', () => {
      testOnFixtures(
        {
          cwd: join(cwdRoot, './invalid'),
          localeDir: `*.{json,yaml,yml}`,
          ruleName: '@intlify/vue-i18n/no-html-messages'
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
    })
  })
})
