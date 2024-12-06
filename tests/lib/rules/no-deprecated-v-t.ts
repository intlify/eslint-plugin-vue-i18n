/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-deprecated-v-t'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module'
  }
})

tester.run('no-deprecated-v-t', rule as never, {
  valid: [],
  invalid: [
    {
      code: `<template><p v-t="'banana'"></p></template>`,
      errors: [
        `'v-t' custom directive is used, but it is deprecated. Use 't' or '$t' instead.`
      ]
    }
  ]
})
