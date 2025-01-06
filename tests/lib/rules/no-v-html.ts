/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-v-html'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module'
  }
})

tester.run('no-v-html', rule as never, {
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
