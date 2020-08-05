/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const RuleTester = require('eslint').RuleTester
const rule = require('../../../lib/rules/no-dynamic-keys')

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015 }
})

tester.run('no-dynamic-keys', rule, {
  valid: [{
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
    // using mustaches in template block
    code: `<template>
      <p>{{ $t('hello') }}</p>
    </template>`
  }, {
    // using custom directive in template block
    code: `<template>
      <p v-t="'hello'"></p>
    </template>`
  }],

  invalid: [{
    // basic
    code: `$t(missing)`,
    errors: [
      `'missing' dynamic key is used'`
    ]
  }, {
    // using mustaches in template block
    code: `<template>
      <p>{{ $t(missing) }}</p>
    </template>`,
    errors: [
      `'missing' dynamic key is used'`
    ]
  }, {
    // using <i18n> functional component in template block
    code: `<template>
      <i18n :path="missing"/>
    </template>`,
    errors: [
      `'missing' dynamic key is used'`
    ]
  }, {
    // using <i18n-t> functional component in template block
    code: `<template>
      <i18n-t :path="missing"/>
    </template>`,
    errors: [
      `'missing' dynamic key is used'`
    ]
  }, {
    // using custom directive in template block
    code: `<template>
      <p v-t="missing"></p>
    </template>`,
    errors: [
      `'missing' dynamic key is used'`
    ]
  }]
})
