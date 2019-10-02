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
    code: `
      <template>
        <div class="app">
          <p class="a1">{{ $t('hello') }}</p>
          <p class="inner">{{ $t('click') }}<a href="/foo">{{ $t('here') }}</a>{{ $t('terminal') }}</p>
        </div>
      </template>
    `
  }, {
    code: `
      <template>
        <comp :value="1" :msg="$t('foo.bar')"/>
        <p>{{ hello }}</p>
      </template>
    `
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
  }, {
    code: `
      <template>
        <md-icon>person</md-icon>
        <v-icon>menu</v-icon>
      </template>
    `,
    options: [{ ignoreNodes: ['md-icon', 'v-icon'] }]
  }, {
    code: `
      <template>
        <p>{{ $t('foo') }}: {{ $t('bar') }}</p>
      </template>
    `,
    options: [{ ignorePattern: '^[-.#:()&]+$' }]
  }, {
    code: `
      <template>
        <p>hello</p>
        <p>world</p>
      </template>
    `,
    options: [{ ignoreText: ['hello', 'world'] }]
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
    // directly specify string literal in mustache
    code: `
      <template>
        <p>{{ 'hello' }}</p>
      </template>
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 3
    }]
  }, {
    // javascript expression specify string literal in mustache
    code: `
      <template>
        <p>{{ ok ? 'hello' : 'world' }}</p>
      </template>
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 3
    }, {
      message: `raw text 'world' is used`, line: 3
    }]
  }, {
    // directly specify string literal in v-text
    code: `
      <template>
        <p v-text="'hello'"></p>
      </template>
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 3
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
    // directly specify string literal to `template` variable
    code: `
      const template = '<p>{{ "hello" }}</p>'
      const Component = {
        template
      }
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 2, column: 30
    }]
  }, {
    // javascript expression specify string literal to `template` variable in mustache
    code: `
      const template = '<p>{{ ok ? "hello" : "world" }}</p>'
      const Component = {
        template
      }
    `,
    errors: [{
      message: `raw text 'hello' is used`, line: 2, column: 35
    }, {
      message: `raw text 'world' is used`, line: 2, column: 45
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
  }, {
    code: `
      <template>
        <md-icon>person</md-icon>
        <v-icon>menu</v-icon>
        <p>hello</p>
      </template>
    `,
    options: [{ ignoreNodes: ['md-icon', 'v-icon'] }],
    errors: [{
      message: `raw text 'hello' is used`, line: 5
    }]
  }, {
    code: `
      <template>
        <p>{{ $t('foo') }}: {{ $t('bar') }}</p>
        <p>hello</p>
      </template>
    `,
    options: [{ ignorePattern: '^[-.#:()&]+$' }],
    errors: [{
      message: `raw text 'hello' is used`, line: 4
    }]
  }, {
    code: `
      <template>
        <p>hello</p>
        <p>world</p>
      </template>
    `,
    options: [{ ignoreText: ['hello'] }],
    errors: [{
      message: `raw text 'world' is used`, line: 4
    }]
  }]
})
