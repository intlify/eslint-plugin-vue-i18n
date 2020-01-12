/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const RuleTester = require('eslint').RuleTester
const rule = require('../../../lib/rules/no-missing-keys')

const baseDir = './tests/fixtures/no-missing-keys/locales'

const settings = {
  'vue-i18n': {
    localeDir: `${baseDir}/*.json`
  }
}

const messageSettings = {
  'vue-i18n': {
    locale: 'en',
    messages: { en: { hello: 'hello world' }},
  }
}

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015 }
})

tester.run('no-missing-keys', rule, {
  valid: [{
    // basic key
    settings,
    code: `$t('hello')`
  }, {
    // nested key
    settings,
    code: `t('messages.nested.hello')`
  }, {
    // linked key
    settings,
    code: `$tc('messages.hello.link')`
  }, {
    // hypened key
    settings,
    code: `tc('hello-dio')`
  }, {
    // key like the message
    settings,
    code: `$t('hello {name}')`
  }, {
    // instance member
    settings,
    code: `i18n.t('hello {name}')`
  }, {
    // identifier
    settings,
    code: `$t(key)`
  }, {
    // using mustaches in template block
    settings,
    code: `<template>
      <p>{{ $t('hello') }}</p>
    </template>`
  }, {
    // using custom directive in template block
    settings,
    code: `<template>
      <p v-t="'hello'"></p>
    </template>`
  }, {
    // using message settings
    settings: messageSettings,
    code: `$t('hello')`
  }],

  invalid: [{
    // basic
    settings,
    code: `$t('missing')`,
    errors: [
      `'missing' does not exist`,
      `'missing' does not exist`
    ]
  }, {
    // using mustaches in template block
    settings,
    code: `<template>
      <p>{{ $t('missing') }}</p>
    </template>`,
    errors: [
      `'missing' does not exist`,
      `'missing' does not exist`
    ]
  }, {
    // using custom directive in template block
    settings,
    code: `<template>
      <p v-t="'missing'"></p>
    </template>`,
    errors: [
      `'missing' does not exist`,
      `'missing' does not exist`
    ]
  }, {
    // using <i18n> functional component in template block
    settings,
    code: `<template>
      <div id="app">
        <i18n path="missing"/>
      </div>
    </template>`,
    errors: [
      `'missing' does not exist`,
      `'missing' does not exist`
    ]
  }, {
    // settings.vue-i18n.localeDir' error
    code: `$t('missing')`,
    errors: [
      'You need to define locales in settings. See the eslint-plugin-vue-i18n documentation'
    ]
  }, {
    // nested basic
    settings,
    code: `$t('missing.path')`,
    errors: [
      `'missing.path' does not exist`,
      `'missing.path' does not exist`,
      `'missing.path' does not exist`,
      `'missing.path' does not exist`
    ]
  }, {
    // using message settings
    settings: messageSettings,
    code: `$t('missing')`,
    errors: [
      `'missing' does not exist`
    ]
  }]
})
