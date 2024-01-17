/**
 * @author Yosuke Ota
 */
import { join } from 'node:path'
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-missing-keys-in-other-locales'
import * as vueParser from 'vue-eslint-parser'
import * as jsonParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

const FIXTURES_ROOT = join(
  __dirname,
  '../../fixtures/no-missing-keys-in-other-locales'
)

const JSON_FILENAME_LOCALE_KEY_TYPE_FILE = join(
  FIXTURES_ROOT,
  'vue-cli-format/locales/test.json'
)
const YAML_FILENAME_LOCALE_KEY_TYPE_FILE = join(
  FIXTURES_ROOT,
  'vue-cli-format/locales/test.yaml'
)

const JSON_FILENAME_LOCALE_KEY_TYPE_KEY = join(
  FIXTURES_ROOT,
  'constructor-option-format/locales/test.json'
)
const YAML_FILENAME_LOCALE_KEY_TYPE_KEY = join(
  FIXTURES_ROOT,
  'constructor-option-format/locales/test.yaml'
)

const SETTINGS = {
  FILE: {
    'vue-i18n': {
      localeDir: `${join(
        FIXTURES_ROOT,
        'vue-cli-format/locales'
      )}/*.{json,yaml,yml}`
    }
  },
  KEY: {
    'vue-i18n': {
      localeDir: {
        pattern: `${join(
          FIXTURES_ROOT,
          'constructor-option-format/locales'
        )}/*.{json,yaml,yml}`,
        localeKey: 'key'
      }
    }
  }
}

const OPTIONS = {
  JSON_LOCALE_KEY_TYPE_FILE: {
    filename: JSON_FILENAME_LOCALE_KEY_TYPE_FILE,
    languageOptions: { parser: jsonParser },
    settings: SETTINGS.FILE
  },
  JSON_LOCALE_KEY_TYPE_KEY: {
    filename: JSON_FILENAME_LOCALE_KEY_TYPE_KEY,
    languageOptions: { parser: jsonParser },
    settings: SETTINGS.KEY
  },
  YAML_LOCALE_KEY_TYPE_FILE: {
    filename: YAML_FILENAME_LOCALE_KEY_TYPE_FILE,
    languageOptions: { parser: yamlParser },
    settings: SETTINGS.FILE
  },
  YAML_LOCALE_KEY_TYPE_KEY: {
    filename: YAML_FILENAME_LOCALE_KEY_TYPE_KEY,
    languageOptions: { parser: yamlParser },
    settings: SETTINGS.KEY
  }
}

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-missing-keys-in-other-locales', rule as never, {
  valid: [
    {
      code: `{"hello": "test"}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_FILE
    },
    {
      // nested key
      code: `{"nest": {"hello": "test"}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_FILE
    },
    {
      code: `{"test-loc": {"hello": "test"}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY
    },
    {
      // nested key
      code: `{"test-loc": {"nest": {"hello": "test"}}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY
    },
    {
      code: `"hello": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_FILE
    },
    {
      // nested key
      code: `
      "nest":
        "hello": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_FILE
    },
    {
      code: `
      "test-loc":
        "hello": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY
    },
    {
      // nested key
      code: `
      "test-loc":
        "nest":
          "hello": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY
    },
    {
      code: `{"only-en": {"hello": "test"}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_FILE,
      options: [{ ignoreLocales: ['ja'] }]
    },
    {
      code: `{"test-loc": {"only-en": {"goodbye": "test"}}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['ja'] }]
    },
    {
      code: `
      ? {ignore-key: 42}
      : Message
      `,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_FILE
    },
    {
      code: `
      ? [{ignore-key: 42}]
      : Message
      `,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_FILE
    }
  ],

  invalid: [
    {
      code: `{"missing": "test"}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_FILE,
      errors: [
        {
          message: "'missing' does not exist in 'ja' and 'en' locale(s)",
          line: 1,
          column: 2
        }
      ]
    },
    {
      // nested key
      code: `{"missing-nest": {"missing": "test"}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_FILE,
      errors: [
        {
          message:
            "'missing-nest.missing' does not exist in 'ja' and 'en' locale(s)",
          line: 1,
          column: 19
        }
      ]
    },
    {
      code: `{"test-loc": {"missing": "test"}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY,
      errors: [
        {
          message: "'missing' does not exist in 'en' and 'ja' locale(s)",
          line: 1,
          column: 15
        }
      ]
    },
    {
      // nested key
      code: `{"test-loc": {"missing-nest": {"missing": "test"}}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY,
      errors: [
        {
          message:
            "'missing-nest.missing' does not exist in 'en' and 'ja' locale(s)",
          line: 1,
          column: 32
        }
      ]
    },
    {
      code: `"missing": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_FILE,
      errors: [
        {
          message: "'missing' does not exist in 'ja' and 'en' locale(s)",
          line: 1,
          column: 1
        }
      ]
    },
    {
      // nested key
      code: `
      "missing-nest":
        "missing": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_FILE,
      errors: [
        {
          message:
            "'missing-nest.missing' does not exist in 'ja' and 'en' locale(s)",
          line: 3,
          column: 9
        }
      ]
    },
    {
      code: `
      "test-loc":
        "missing": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY,
      errors: [
        {
          message: "'missing' does not exist in 'en' and 'ja' locale(s)",
          line: 3,
          column: 9
        }
      ]
    },
    {
      // nested key
      code: `
      "test-loc":
        "missing-nest":
          "missing": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY,
      errors: [
        {
          message:
            "'missing-nest.missing' does not exist in 'en' and 'ja' locale(s)",
          line: 4,
          column: 11
        }
      ]
    },
    {
      code: `{"only-en": {"hello": "test"}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_FILE,
      errors: ["'only-en.hello' does not exist in 'ja' locale(s)"]
    },
    {
      code: `{"test-loc": {"only-en": {"goodbye": "test"}}}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY,
      errors: ["'only-en.goodbye' does not exist in 'ja' locale(s)"]
    },
    {
      code: `
      "test-loc":
        "missing": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['ja'] }],
      errors: [
        {
          message: "'missing' does not exist in 'en' locale(s)",
          line: 3,
          column: 9
        }
      ]
    },
    {
      // nested key
      code: `
      "test-loc":
        "missing-nest":
          "missing": "test"`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['ja'] }],
      errors: [
        {
          message: "'missing-nest.missing' does not exist in 'en' locale(s)",
          line: 4,
          column: 11
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n>
      {
        "en": {
          "hello": "Hello!",
          "goodbye": "Goodbye!"
        },
        "ja": {
          "hello": "こんにちは!"
        }
      }
      </i18n>`,
      errors: [
        {
          message: "'goodbye' does not exist in 'ja' locale(s)",
          line: 6,
          column: 11
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n lang="yaml">
      "en":
        "hello": "Hello!"
        "goodbye": "Goodbye!"
      </i18n>
      <i18n lang="yaml">
      "ja":
        "hello": "こんにちは!"
      </i18n>`,
      errors: [
        {
          message: "'goodbye' does not exist in 'ja' locale(s)",
          line: 5,
          column: 9
        }
      ]
    },

    // array
    {
      code: `{"test-loc": [ { "missing": "test"} ]}`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['en'] }],
      errors: ["'[0].missing' does not exist in 'ja' locale(s)"]
    },
    {
      code: `
      "test-loc": ["missing": "test"]`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['en'] }],
      errors: ["'[0].missing' does not exist in 'ja' locale(s)"]
    },

    // values
    {
      code: `
      {
        "test-loc": {
          "missing1": "s",
          "missing2": 42,
          "missing3": -42,
          "missing4": null,
          "missing5": {},
          "missing6": Infinity
        }
      }`,
      ...OPTIONS.JSON_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['en'] }],
      errors: [
        "'missing1' does not exist in 'ja' locale(s)",
        "'missing2' does not exist in 'ja' locale(s)",
        "'missing3' does not exist in 'ja' locale(s)",
        "'missing6' does not exist in 'ja' locale(s)"
      ]
    },
    {
      code: `
      "test-loc":
        "missing1": "s"
        "missing2": 42
        "missing3": -42
        "missing4": null
        "missing5":
        "missing6": {}
        "missing7": &foo 42
        "missing8": *foo
        "missing9": &bar {}`,
      ...OPTIONS.YAML_LOCALE_KEY_TYPE_KEY,
      options: [{ ignoreLocales: ['en'] }],
      errors: [
        "'missing1' does not exist in 'ja' locale(s)",
        "'missing2' does not exist in 'ja' locale(s)",
        "'missing3' does not exist in 'ja' locale(s)",
        "'missing7' does not exist in 'ja' locale(s)",
        "'missing8' does not exist in 'ja' locale(s)"
      ]
    }
  ]
})
