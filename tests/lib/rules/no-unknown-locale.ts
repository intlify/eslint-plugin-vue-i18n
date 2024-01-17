import { join } from 'node:path'
import { RuleTester } from '../eslint-compat'

import rule from '../../../lib/rules/no-unknown-locale'
import type { SettingsVueI18nLocaleDirObject } from '../../../lib/types'
import * as vueParser from 'vue-eslint-parser'
import * as jsonParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

const fileLocalesRoot = join(__dirname, '../../fixtures/no-unknown-locale/file')
const keyLocalesRoot = join(__dirname, '../../fixtures/no-unknown-locale/key')

const options = {
  json: {
    fileTest: {
      languageOptions: { parser: jsonParser },
      filename: join(fileLocalesRoot, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: `${fileLocalesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    fileEn: {
      languageOptions: { parser: jsonParser },
      filename: join(fileLocalesRoot, 'en.json'),
      settings: {
        'vue-i18n': {
          localeDir: `${fileLocalesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    key: {
      languageOptions: { parser: jsonParser },
      filename: join(keyLocalesRoot, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: {
            pattern: `${keyLocalesRoot}/*.{json,yaml,yml}`,
            localeKey: 'key'
          } as SettingsVueI18nLocaleDirObject
        }
      }
    }
  },
  yaml: {
    fileTest: {
      languageOptions: { parser: yamlParser },
      filename: join(fileLocalesRoot, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: `${fileLocalesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    fileEn: {
      languageOptions: { parser: yamlParser },
      filename: join(fileLocalesRoot, 'en.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: `${fileLocalesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    key: {
      languageOptions: { parser: yamlParser },
      filename: join(keyLocalesRoot, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: {
            pattern: `${keyLocalesRoot}/*.{json,yaml,yml}`,
            localeKey: 'key'
          } as SettingsVueI18nLocaleDirObject
        }
      }
    }
  }
}

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module'
  }
})

tester.run('no-unknown-locale', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
      <i18n locale="en">
      {"msg_key":{}}
      </i18n>
      <i18n locale="ja">
      {"msg_key":{}}
      </i18n>
      <i18n locale="i-enochian">
      {"msg_key":{}}
      </i18n>
      <i18n locale="zh">
      {"msg_key":{}}
      </i18n>
      <i18n locale="zh-Hant">
      {"msg_key":{}}
      </i18n>
      <i18n>
      {
        "sr-Latn-CS": {"msg_key":{}},
        "en-US":  {"msg_key":{}}
      }
      </i18n>
      `
    },
    {
      code: `{"msg_key":{}}`,
      ...options.yaml.fileEn
    },
    {
      code: `{"msg_key":{}}`,
      ...options.json.fileEn
    },
    {
      code: `{"en":{"msg_key":{}}}`,
      ...options.yaml.key
    },
    {
      code: `{"en":{"msg_key":{}}}`,
      ...options.json.key
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="easy_ja">
      </i18n>
      <i18n>
      {
        "easy_ja": {}
      }
      </i18n>
      `,
      options: [{ locales: ['easy_ja'] }]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="easy_ja">
      </i18n>
      <i18n>
      {
        "easy_ja": {}
      }
      </i18n>
      `,
      options: [{ locales: ['easy_ja'], disableRFC5646: true }]
    }
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
      <i18n locale="unknown">
      </i18n>
      <i18n locale="zh-Hant">
      </i18n>
      <i18n locale="ja-foo">
      </i18n>
      <i18n>
      {
        "foo": {},
        "en": {},
        "b-ar": {}
      }
      </i18n>
      `,
      errors: [
        {
          message: "'unknown' is unknown locale name",
          line: 2,
          column: 13
        },
        {
          message: "'ja-foo' is unknown locale name",
          line: 6,
          column: 13
        },
        {
          message: "'foo' is unknown locale name",
          line: 10,
          column: 9
        },
        {
          message: "'b-ar' is unknown locale name",
          line: 12,
          column: 9
        }
      ]
    },
    {
      code: `{"msg_key":{}}`,
      ...options.yaml.fileTest,
      errors: [
        {
          message: "'test' is unknown locale name",
          line: 1,
          column: 1
        }
      ]
    },
    {
      code: `{"msg_key":{}}`,
      ...options.json.fileTest,
      errors: [
        {
          message: "'test' is unknown locale name",
          line: 1,
          column: 1
        }
      ]
    },
    {
      code: `{"foo":{"msg_key":{}}}`,
      ...options.yaml.key,
      errors: [
        {
          message: "'foo' is unknown locale name",
          line: 1,
          column: 2
        }
      ]
    },
    {
      code: `{"foo":{"msg_key":{}}}`,
      ...options.json.key,
      errors: [
        {
          message: "'foo' is unknown locale name",
          line: 1,
          column: 2
        }
      ]
    },
    {
      filename: 'test.vue',
      code: `
      <i18n locale="easy_ja">
      </i18n>
      <i18n locale="en">
      </i18n>
      <i18n>
      {
        "easy_ja": {},
        "en": {},
      }
      </i18n>
      `,
      options: [{ locales: ['easy_ja'], disableRFC5646: true }],
      errors: [
        {
          message: "'en' is unknown locale name",
          line: 4,
          column: 13
        },
        {
          message: "'en' is unknown locale name",
          line: 9,
          column: 9
        }
      ]
    }
  ]
})
