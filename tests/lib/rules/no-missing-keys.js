/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const path = require('path')
const RuleTester = require('eslint').RuleTester
const rule = require('../../../lib/rules/no-missing-keys')

const localeDirs = [
  './tests/fixtures/no-missing-keys/vue-cli-format/locales/*.json',
  { pattern: './tests/fixtures/no-missing-keys/constructor-option-format/locales/*.json', localeKey: 'key' }
]

function buildTestsForLocales (testcases, otherTestcases) {
  const result = []
  for (const testcase of testcases) {
    for (const localeDir of localeDirs) {
      result.push({ ...testcase, settings: {
        'vue-i18n': { localeDir }
      }})
    }
  }
  return [...result, ...otherTestcases]
}

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015 }
})

tester.run('no-missing-keys', rule, {
  valid: buildTestsForLocales([{
    // basic key
    code: `$t('hello')`
  }, {
    // nested key
    code: `t('messages.nested.hello')`
  }, {
    // linked key
    code: `$tc('messages.hello.link')`
  }, {
    // hypened key
    code: `tc('hello-dio')`
  }, {
    // key like the message
    code: `$t('hello {name}')`
  }, {
    // instance member
    code: `i18n.t('hello {name}')`
  }, {
    // identifier
    code: `$t(key)`
  }, {
    // using mustaches in template block
    code: `<template>
      <p>{{ $t('hello') }}</p>
    </template>`
  }, {
    // using custom directive in template block
    code: `<template>
      <p v-t="'hello'"></p>
    </template>`
  }], [{
    // sfc supports
    code: `<i18n>{"en": {"hello": "hello"}}</i18n>
    <template>
      <p v-t="'hello'"></p>
    </template>`
  }, {
    // sfc with locale
    code: `<i18n locale="en">{"hello": "hello"}</i18n>
    <i18n locale="ja">{"hello": "こんにちは"}</i18n>
    <template>
      <p v-t="'hello'"></p>
    </template>`
  }, {
    // sfc with src
    filename: path.join(__dirname, '../../fixtures/no-missing-keys/sfc/src/Test.vue'),
    code: `<i18n src="../locales/json01.json" />
    <template>
      <p v-t="'hello'"></p>
    </template>`
  }, {
    // sfc with src and locale
    filename: path.join(__dirname, '../../fixtures/no-missing-keys/sfc/src/Test.vue'),
    code: `<i18n src="../locales/json02-en.json" locale="en" />
    <i18n src="../locales/json02-ja.json" locale="ja" />
    <template>
      <p v-t="'hello'"></p>
    </template>`
  }, {
    // unuse i18n sfc
    filename: 'test.vue',
    code: `
    <template>
      <div id="app"></div>
    </template>`
  }]),

  invalid: buildTestsForLocales([{
    // basic
    code: `$t('missing')`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // using mustaches in template block
    code: `<template>
      <p>{{ $t('missing') }}</p>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // using custom directive in template block
    code: `<template>
      <p v-t="'missing'"></p>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // using <i18n> functional component in template block
    code: `<template>
      <div id="app">
        <i18n path="missing"/>
      </div>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // using <i18n-t> functional component in template block
    code: `<template>
      <div id="app">
        <i18n-t path="missing"/>
      </div>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // nested basic
    code: `$t('missing.path')`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // nested missing
    code: `$t('messages.missing')`,
    errors: [
      `'messages.missing' does not exist in 'en'`,
      `'messages.missing' does not exist in 'ja'`
    ]
  }], [{
    // settings.vue-i18n.localeDir' error
    code: `$t('missing')`,
    errors: [
      `You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation`
    ]
  }, {
    // sfc supports
    code: `<i18n>{"en": {"hello": "hello"}}</i18n>
    <template>
      <p v-t="'missing'"></p>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`
    ]
  }, {
    // sfc with locale
    code: `<i18n locale="en">{"hello": "hello"}</i18n>
    <i18n locale="ja">{"hello": "こんにちは"}</i18n>
    <template>
      <p v-t="'missing'"></p>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // sfc with locale
    code: `<i18n locale="en">{"hello": "hello"}</i18n>
    <i18n locale="ja">{"he": "こんにちは"}</i18n>
    <template>
      <p v-t="'hello'"></p>
    </template>`,
    errors: [
      `'hello' does not exist in 'ja'`
    ]
  }, {
    // sfc with src
    filename: path.join(__dirname, '../../fixtures/no-missing-keys/sfc/src/Test.vue'),
    code: `<i18n src="../locales/json01.json" />
    <template>
      <p v-t="'missing'"></p>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }, {
    // sfc with src and locale
    filename: path.join(__dirname, '../../fixtures/no-missing-keys/sfc/src/Test.vue'),
    code: `<i18n src="../locales/json02-en.json" locale="en" />
    <i18n src="../locales/json02-ja.json" locale="ja" />
    <template>
      <p v-t="'missing'"></p>
    </template>`,
    errors: [
      `'missing' does not exist in 'en'`,
      `'missing' does not exist in 'ja'`
    ]
  }])
})
