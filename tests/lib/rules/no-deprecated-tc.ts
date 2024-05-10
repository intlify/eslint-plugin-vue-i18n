/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-deprecated-tc'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-deprecated-tc', rule as never, {
  valid: [],
  invalid: [
    {
      // tc key
      code: `tc('banana')`,
      errors: [`'tc' is used, but it is deprecated. Use 't' or '$t' instead.`]
    },
    {
      // $tc key
      code: `$tc('banana')`,
      errors: [`'$tc' is used, but it is deprecated. Use 't' or '$t' instead.`]
    },
    {
      // via i18n instance
      code: `i18n.tc('banana')`,
      errors: [`'tc' is used, but it is deprecated. Use 't' or '$t' instead.`]
    },
    {
      // using mustaches in template block
      code: `<template>
      <p>{{ $tc('banana') }}</p>
    </template>`,
      errors: [`'$tc' is used, but it is deprecated. Use 't' or '$t' instead.`]
    }
  ]
})
