/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { CLIEngine, RuleTester } from 'eslint'
import { resolve, join } from 'path'
import fs from 'fs'
import assert from 'assert'
import rule = require('../../../lib/rules/no-html-messages')
import plugin = require('../../../lib/index')
import { baseConfigPath } from '../test-utils'

new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015, sourceType: 'module' }
}).run('no-html-messages', rule as never, {
  valid: [
    {
      // sfc supports
      filename: 'test.vue',
      code: `<i18n>${fs
        .readFileSync(
          require.resolve('../../fixtures/no-html-messages/valid/en.json'),
          'utf8'
        )
        .replace(/</g, '&lt;')}</i18n>
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
      code: `<i18n>${fs
        .readFileSync(
          require.resolve('../../fixtures/no-html-messages/invalid/en.json'),
          'utf8'
        )
        .replace(/</g, '&lt;')}</i18n>
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
      code: `<i18n lang="yaml">${fs
        .readFileSync(
          require.resolve('../../fixtures/no-html-messages/invalid/en.yaml'),
          'utf8'
        )
        .replace(/</g, '&lt;')}</i18n>
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
  const cwd = join(__dirname, '../../fixtures/no-html-messages')
  let originalCwd: string

  before(() => {
    originalCwd = process.cwd()
    process.chdir(cwd)
  })

  after(() => {
    process.chdir(originalCwd)
  })

  describe('valid', () => {
    it('should be not detected html messages', () => {
      const linter = new CLIEngine({
        cwd,
        baseConfig: {
          extends: [baseConfigPath],
          settings: {
            'vue-i18n': {
              localeDir: `./valid/*.{json,yaml,yml}`
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015
        },
        rules: {
          '@intlify/vue-i18n/no-html-messages': 'error'
        },
        extensions: ['.js', '.vue', '.json', '.yaml', '.yml']
      })

      linter.addPlugin('@intlify/vue-i18n', plugin)
      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 0)
    })
  })

  describe('invalid', () => {
    it('should be detected html messages', () => {
      const linter = new CLIEngine({
        cwd,
        baseConfig: {
          extends: [baseConfigPath],
          settings: {
            'vue-i18n': {
              localeDir: `./invalid/*.{json,yaml,yml}`
            }
          }
        },
        useEslintrc: false,
        parserOptions: {
          ecmaVersion: 2015
        },
        rules: {
          '@intlify/vue-i18n/no-html-messages': 'error'
        },
        extensions: ['.js', '.vue', '.json', '.yaml', '.yml']
      })
      linter.addPlugin('@intlify/vue-i18n', plugin)

      const messages = linter.executeOnFiles(['.'])
      assert.equal(messages.errorCount, 6)

      function checkRuleId(path: string) {
        const fullPath = resolve(__dirname, path)
        const result = messages.results.find(
          result => result.filePath === fullPath
        )!
        assert.equal(result.messages.length, 3)
        result.messages.forEach(message => {
          assert.equal(message.ruleId, '@intlify/vue-i18n/no-html-messages')
        })
      }
      checkRuleId('../../fixtures/no-html-messages/invalid/en.json')
      checkRuleId('../../fixtures/no-html-messages/invalid/en.yaml')
    })
  })
})
