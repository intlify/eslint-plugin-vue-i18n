/**
 * @author Yosuke Ota
 */
import { join } from 'node:path'
import { RuleTester, TEST_RULE_ID_PREFIX } from '../eslint-compat'
import rule from '../../../lib/rules/valid-message-syntax'
import * as vueParser from 'vue-eslint-parser'
import * as jsonParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

const localesRoot = join(__dirname, '../../fixtures/valid-message-syntax')

const options = {
  json: {
    default: {
      languageOptions: { parser: jsonParser },
      filename: join(localesRoot, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: `${localesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    v9: {
      languageOptions: { parser: jsonParser },
      filename: join(localesRoot, 'test.json'),
      settings: {
        'vue-i18n': {
          localeDir: `${localesRoot}/*.{json,yaml,yml}`,
          messageSyntaxVersion: '^9.0.0'
        }
      }
    }
  },
  yaml: {
    default: {
      languageOptions: { parser: yamlParser },
      filename: join(localesRoot, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: `${localesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    v9: {
      languageOptions: { parser: yamlParser },
      filename: join(localesRoot, 'test.yaml'),
      settings: {
        'vue-i18n': {
          localeDir: `${localesRoot}/*.{json,yaml,yml}`,
          messageSyntaxVersion: '^9.0.0'
        }
      }
    }
  },
  vue: {
    default: {
      languageOptions: { parser: vueParser },
      filename: join(localesRoot, 'test.vue'),
      settings: {
        'vue-i18n': {
          localeDir: `${localesRoot}/*.{json,yaml,yml}`
        }
      }
    },
    v9: {
      languageOptions: { parser: vueParser },
      filename: join(localesRoot, 'test.vue'),
      settings: {
        'vue-i18n': {
          localeDir: `${localesRoot}/*.{json,yaml,yml}`,
          messageSyntaxVersion: '^9.0.0'
        }
      }
    }
  }
}

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('valid-message-syntax', rule as never, {
  valid: [
    {
      code: `
      {
        "list-hello": "Hello! {0}",
        "named-hello": "Hello! {name}",
        "linked-hello": "@:list-hello"
      }
      `,
      ...options.json.default
    },
    {
      code: `
      key: message {foo}
      `,
      ...options.yaml.default
    },
    {
      code: `
      key: message {foo}
      `,
      ...options.yaml.v9
    },
    {
      code: `
      key: message { v9 }
      `,
      ...options.yaml.v9
    }
  ],

  invalid: [
    {
      code: `
      {
        "list-hello": "Hello! {{0}}",
        "named-hello": "Hello! {{name}}"
      }
      `,
      ...options.json.default,
      errors: [
        {
          message: `If you want to use '${TEST_RULE_ID_PREFIX}valid-message-syntax' rule, you need to set 'messageSyntaxVersion' at 'settings'. See the 'eslint-plugin-vue-i18n' documentation`,
          line: 1,
          column: 1
        },
        {
          message: 'Not allowed nest placeholder',
          line: 3,
          column: 32
        },
        {
          message: 'Not allowed nest placeholder',
          line: 4,
          column: 33
        }
      ]
    },
    {
      code: `
      {
        "list-hello": "Hello! {{0}}",
        "named-hello": "Hello! {{name}}"
      }
      `,
      ...options.json.v9,
      errors: [
        {
          message: 'Not allowed nest placeholder',
          line: 3,
          column: 32
        },
        {
          message: 'Not allowed nest placeholder',
          line: 4,
          column: 33
        }
      ]
    },
    {
      code: `
      <i18n lang="yaml">
      foo:
        a: "message {invalid"
        b: [ "message {valid}" ]
      </i18n>
      <i18n lang="yaml">
      bar:
        a: "message {invalid"
        b: [ "message {valid}" ]
      </i18n>
      <!-- with v9 -->
      `,
      ...options.vue.v9,
      errors: [
        {
          message: 'Unterminated closing brace',
          line: 4,
          column: 22
        },
        {
          message: 'Unterminated closing brace',
          line: 9,
          column: 22
        }
      ]
    },
    {
      code: `
      <i18n lang="yaml">
      foo:
        a: "message {invalid"
        b: [ "message {valid}" ]
      </i18n>
      <i18n lang="yaml">
      bar:
        a: "message {invalid"
        b: [ "message {valid}" ]
      </i18n>
      <!-- with default -->
      `,
      ...options.vue.default,
      errors: [
        {
          message: `If you want to use '${TEST_RULE_ID_PREFIX}valid-message-syntax' rule, you need to set 'messageSyntaxVersion' at 'settings'. See the 'eslint-plugin-vue-i18n' documentation`,
          line: 1,
          column: 1
        },
        {
          message: 'Unterminated closing brace',
          line: 4,
          column: 22
        },
        {
          message: 'Unterminated closing brace',
          line: 9,
          column: 22
        }
      ]
    },
    {
      code: `
      foo:
        a: "message {invalid"
        b: [ "message { in-valid }" ]
        c:
        ? { d: "not {message " }
        : "message valid"
        ? ["not {message "]
        : "message valid"
        e: &anchor {
          key: &anchorValid "message valid"
        }
        f: *anchor
        g: &anchorInvalid "message {invalid"
        h: *anchorInvalid
        i: *anchorValid
      `,
      ...options.yaml.v9,
      errors: [
        {
          message: 'Unterminated closing brace',
          line: 3,
          column: 22
        },
        {
          message: "Unexpected 'null' message",
          line: 5,
          column: 9,
          endLine: 5,
          endColumn: 11
        },
        {
          message: 'Unterminated closing brace',
          line: 14,
          column: 37
        },
        {
          message: 'Unterminated closing brace',
          line: 15,
          column: 12,
          endLine: 15,
          endColumn: 26
        }
      ]
    }
  ]
})
