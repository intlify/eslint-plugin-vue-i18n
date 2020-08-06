/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const RuleTester = require('eslint').RuleTester
const rule = require('../../../lib/rules/no-v-html')

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: { ecmaVersion: 2015 }
})

tester.run('no-v-html', rule, {
  valid: [
    {
      code: `<template>
      <div class="app">
        <i18n path="term" tag="label" for="tos">
          <a :href="url" target="_blank">{{ $t('tos') }}</a>
        </i18n>
      </div>
    </template>`
    }
  ],

  invalid: [
    {
      code: `<template>
      <p v-html="$t('hello')"></p>
    </template>`,
      errors: [`Using $t on 'v-html' directive can lead to XSS attack.`]
    },
    {
      code: `<template>
      <p v-html="this.t('hello')"></p>
    </template>`,
      errors: [`Using t on 'v-html' directive can lead to XSS attack.`]
    }
  ]
})
