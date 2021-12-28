import { join } from 'path'
import { RuleTester } from 'eslint'

import rule = require('../../../lib/rules/valid-message-text')

const vueParser = require.resolve('vue-eslint-parser')
const jsonParser = require.resolve('jsonc-eslint-parser')
const yamlParser = require.resolve('yaml-eslint-parser')

const fixturesRoot = join(__dirname, '../../fixtures/valid-message-text')

const tester = new RuleTester({
  parser: vueParser,
  parserOptions: { ecmaVersion: 2015 }
})

tester.run('valid-message-text', rule as never, {
  valid: [
    {
      code: `
      {
        "valid": "valid"
      }
      `,
      parser: jsonParser,
      filename: join(fixturesRoot, 'en.json'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}'
        }
      },
      options: [
        {
          validators: {
            en: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ]
    },
    {
      code: `
      {
        "valid": [
          "valid1",
          "valid2"
        ]
      }
      `,
      parser: jsonParser,
      filename: join(fixturesRoot, 'en.json'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}'
        }
      },
      options: [
        {
          validators: {
            en: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ]
    },
    {
      code: `
      valid: valid
      `,
      parser: yamlParser,
      filename: join(fixturesRoot, 'en.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}'
        }
      },
      options: [
        {
          validators: {
            en: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ]
    },
    {
      code: `
      valid:
        - valid1
        - valid2
      `,
      parser: yamlParser,
      filename: join(fixturesRoot, 'en.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}'
        }
      },
      options: [
        {
          validators: {
            en: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ]
    }
  ],

  invalid: [
    {
      code: `
      {
        "foo": {
          "a": "not-allowed",
          "b": "valid"
        }
      }
      `,
      parser: jsonParser,
      filename: join(fixturesRoot, 'en.json'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}'
        }
      },
      options: [
        {
          validators: {
            en: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ],
      errors: [
        {
          message:
            '\'foo.a\' contains following errors: Contains "not-allowed"',
          line: 4,
          column: 16
        }
      ]
    },

    {
      code: `
      <i18n lang="yaml">
      foo:
        a: "not-allowed"
        b: "valid"
      </i18n>
      <i18n lang="yaml">
      bar:
        a: "not-allowed"
        b: "valid"
      </i18n>
      `,
      parser: vueParser,
      filename: join(fixturesRoot, 'test.vue'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}',
          messageSyntaxVersion: '^9.0.0'
        }
      },
      options: [
        {
          validators: {
            foo: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ],
      errors: [
        {
          message: '\'a\' contains following errors: Contains "not-allowed"',
          line: 4,
          column: 12
        }
      ]
    },

    {
      code: `
      <i18n lang="yaml" locale="foo">
      a: "not-allowed"
      b: "valid"
      </i18n>
      <i18n lang="yaml" locale="bar">
      a: "not-allowed"
      b: "valid"
      </i18n>
      `,
      parser: vueParser,
      filename: join(fixturesRoot, 'test.vue'),
      settings: {
        'vue-i18n': {
          localeDir: fixturesRoot + '/*.{json,yaml,yml}',
          messageSyntaxVersion: '^9.0.0'
        }
      },
      options: [
        {
          validators: {
            foo: [join(fixturesRoot, 'validators/not-allowed.js')]
          }
        }
      ],
      errors: [
        {
          message: '\'a\' contains following errors: Contains "not-allowed"',
          line: 3,
          column: 10
        }
      ]
    }
  ]
})
