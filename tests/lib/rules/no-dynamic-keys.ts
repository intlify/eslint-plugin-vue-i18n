/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-dynamic-keys'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 2015 }
})

tester.run('no-dynamic-keys', rule as never, {
  valid: [
    {
      // basic key
      code: `$t('hello')`
    },
    {
      // nested key
      code: `t('messages.nested.hello')`
    },
    {
      // linked key
      code: `$tc('messages.hello.link')`
    },
    {
      // hypened key
      code: `tc('hello-dio')`
    },
    {
      // key like the message
      code: `$t('hello {name}')`
    },
    {
      // instance member
      code: `i18n.t('hello {name}')`
    },
    {
      // using mustaches in template block
      code: `<template>
      <p>{{ $t('hello') }}</p>
    </template>`
    },
    {
      // using custom directive in template block
      code: `<template>
      <p v-t="'hello'"></p>
    </template>`
    },
    {
      code: `
      <template>
        <p>{{ $t(\`foo\`) }}</p>
        <i18n :path="\`foo\`"/>
        <p v-t="\`foo\`"></p>
      </template>
      <script>
      i18n.t(\`foo\`)
      </script>`
    }
  ],

  invalid: [
    {
      // basic
      code: `$t(missing)`,
      errors: [`'missing' dynamic key is used'`]
    },
    {
      // using mustaches in template block
      code: `<template>
      <p>{{ $t(missing) }}</p>
    </template>`,
      errors: [`'missing' dynamic key is used'`]
    },
    {
      // using <i18n> functional component in template block
      code: `<template>
      <i18n :path="missing"/>
    </template>`,
      errors: [`'missing' dynamic key is used'`]
    },
    {
      // using <i18n-t> functional component in template block
      code: `<template>
      <i18n-t :path="missing"/>
    </template>`,
      errors: [`'missing' dynamic key is used'`]
    },
    {
      // using custom directive in template block
      code: `<template>
      <p v-t="missing"></p>
    </template>`,
      errors: [`'missing' dynamic key is used'`]
    },
    {
      code: `
      <template>
        <p>{{ $t(foo.dynamic) }}</p>
        <i18n :path="foo.dynamic"/>
        <p v-t="foo.dynamic"></p>
      </template>
      <script>
      i18n.t(foo.dynamic)
      </script>`,
      errors: [
        "'foo.dynamic' dynamic key is used'",
        "'foo.dynamic' dynamic key is used'",
        "'foo.dynamic' dynamic key is used'",
        "'foo.dynamic' dynamic key is used'"
      ]
    },
    {
      code: `
      <template>
        <p>{{ $t(foo()) }}</p>
        <i18n :path="foo()"/>
        <p v-t="foo()"></p>
      </template>
      <script>
      i18n.t(foo())
      </script>`,
      errors: [
        "'foo()' dynamic key is used'",
        "'foo()' dynamic key is used'",
        "'foo()' dynamic key is used'",
        "'foo()' dynamic key is used'"
      ]
    }
  ]
})
