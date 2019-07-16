/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const RuleTester = require('eslint').RuleTester
const rule = require('../../../lib/rules/no-raw-text')

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
})

tester.run('no-raw-text', rule, {
  valid: [{
    code: `<template>
      <div class="app">
        <p class="a1">{{ $t('hello') }}</p>
        <p class="inner">{{ $t('click') }}<a href="/foo">{{ $t('here') }}</a>{{ $t('terminal') }}</p>
      </div>
    </template>`
  }, {
    filename: 'test.vue',
    code: `
      export default {
        template: '<p>{{ $t('hello') }}</p>'
      }
    `
  }, {
    code: `
      export default {
        render: function (h) {
          return (<p>{this.$t('hello')}</p>)
        }
      }
    `
  }, {
    code: `
      export default {
        props: {
          template: Object
        }
      }
    `
  }],

  invalid: [{
    // simple template
    code: `<template><p>hello</p></template>`,
    errors: [{
      message: `raw text 'hello' is used`, line: 1
    }]
  }, {
    // included newline or tab or space in simple template
    code: `
      <template>
        <p>hello</p>
      </template>
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 3
    }]
  }, {
    // child elements in template
    code: `
      <template>
        <div class="app">
          <p class="a1">hello</p>
          <p class="inner">click<a href="/foo">here</a>!</p>
        </div>
      </template>
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 4
    }, {
      message: `raw text 'click' is used`, line: 5
    }, {
      message: `raw text 'here' is used`, line: 5
    }, {
      message: `raw text '!' is used`, line: 5
    }]
  }, {
    // directly specify string literal to `template` component option at export default object
    code: `
      export default {
        template: '<p>hello</p>'
      }
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 3
    }]
  }, {
    // directly specify string literal to `template` component option at variable
    code: `
      const Component = {
        template: '<p>hello</p>'
      }
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 3
    }]
  }, {
    // directly specify string literal to `template` variable
    code: `
      const template = '<p>hello</p>'
      const Component = {
        template
      }
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 2
    }]
  }, {
    // directly specify string literal to JSX with `render`
    code: `
      const Component = {
        render () {
          return (<p>hello</p>)
        }
      }
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 4
    }]
  }]
})
