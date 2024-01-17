/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/no-raw-text'
import * as vueParser from 'vue-eslint-parser'

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      }
    }
  }
})

tester.run('no-raw-text', rule as never, {
  valid: [
    {
      code: `
      <template>
        <div class="app">
          <p class="a1">{{ $t('hello') }}</p>
          <p class="inner">{{ $t(\`click\`) }}<a href="/foo">{{ $t('here') }}</a>{{ $t('terminal') }}</p>
        </div>
      </template>
    `
    },
    {
      code: `
      <template>
        <comp :value="1" :msg="$t('foo.bar')"/>
        <p>{{ hello }}</p>
      </template>
    `
    },
    {
      filename: 'test.vue',
      code: `
      export default {
        template: '<p>{{ $t('hello') }}</p>'
      }
    `
    },
    {
      code: `
      export default {
        render: function (h) {
          return (<p>{this.$t('hello')}</p>)
        }
      }
    `
    },
    {
      code: `
      export default {
        props: {
          template: Object
        }
      }
    `
    },
    {
      code: `
      <template>
        <md-icon>person</md-icon>
        <v-icon>menu</v-icon>
      </template>
    `,
      options: [{ ignoreNodes: ['md-icon', 'v-icon'] }]
    },
    {
      code: `
      <template>
        <p>{{ $t('foo') }}: {{ $t('bar') }}</p>
      </template>
    `,
      options: [{ ignorePattern: '^[-.#:()&]+$' }]
    },
    {
      code: `
      <template>
        <p>hello</p>
        <p>world</p>
      </template>
    `,
      options: [{ ignoreText: ['hello', 'world'] }]
    },
    {
      // specify a template literal with expression as `template`
      code: 'export default { template: `<p>${msg}</p>` }'
    },
    {
      code: 'export default { template: `<p>raw</p>` }',
      filename: 'unknown.js'
    },
    `
    <script>
    export default Vue.extend({
      components: {
      },

      data() {
        return {
          template: 'foo'
        }
      },
    })
    </script>
    `,
    `
    <script>
    export default Vue.extend({
      components: {
      },

      data() {
        return {
          template: null
        }
      },
    })
    </script>
    `,
    `
    <script>
    export default Vue.extend({
      template: null
    })
    </script>
    `,
    `
    <script setup>
    export default {
      template: 'script setup'
    }
    </script>
    `,
    `
    const CONST = {
      template: 'maybe const value'
    }
    const varValue = {
      template: 'maybe normal variable'
    }
    `
  ],

  invalid: [
    {
      // simple template
      code: `<template><p>hello</p></template>`,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 1,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `<i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template><p>{{$t('hello')}}</p></template>`
            }
          ]
        }
      ]
    },
    {
      // included newline or tab or space in simple template
      code: `
      <template>
        <p>hello</p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p>{{$t('hello')}}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // child elements in template
      code: `
      <template>
        <div class="app">
          <p class="a1">hello</p>
          <p class="inner">click<a href="/foo">here</a>!</p>
        </div>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 4,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <div class="app">
          <p class="a1">{{$t('hello')}}</p>
          <p class="inner">click<a href="/foo">here</a>!</p>
        </div>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text 'click' is used`,
          line: 5,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "click": "click"
  }
}
</i18n>

<template>
        <div class="app">
          <p class="a1">hello</p>
          <p class="inner">{{$t('click')}}<a href="/foo">here</a>!</p>
        </div>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text 'here' is used`,
          line: 5,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "here": "here"
  }
}
</i18n>

<template>
        <div class="app">
          <p class="a1">hello</p>
          <p class="inner">click<a href="/foo">{{$t('here')}}</a>!</p>
        </div>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text '!' is used`,
          line: 5,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "!": "!"
  }
}
</i18n>

<template>
        <div class="app">
          <p class="a1">hello</p>
          <p class="inner">click<a href="/foo">here</a>{{$t('!')}}</p>
        </div>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // directly specify string literal in mustache
      code: `
      <template>
        <p>{{ 'hello' }}</p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p>{{ $t('hello') }}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // directly specify template literal in mustache
      code: `
      <template>
        <p>{{ \`hello\` }}</p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p>{{ $t(\`hello\`) }}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // javascript expression specify string literal in mustache
      code: `
      <template>
        <p>{{ ok ? 'hello' : 'world' }}</p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p>{{ ok ? $t('hello') : 'world' }}</p>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text 'world' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "world": "world"
  }
}
</i18n>

<template>
        <p>{{ ok ? 'hello' : $t('world') }}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // javascript expression specify template literal in mustache
      code: `
      <template>
        <p>{{ ok ? \`hello\` : \`world\` }}</p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p>{{ ok ? $t(\`hello\`) : \`world\` }}</p>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text 'world' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "world": "world"
  }
}
</i18n>

<template>
        <p>{{ ok ? \`hello\` : $t(\`world\`) }}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // directly specify string literal in v-text
      code: `
      <template>
        <p v-text="'hello'"></p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p v-text="$t('hello')"></p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // directly specify tempate literal in v-text
      code: `
      <template>
        <p v-text="\`hello\`"></p>
      </template>
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p v-text="$t(\`hello\`)"></p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      // directly specify string literal to `template` component option at export default object
      code: `
      export default {
        template: '<p>hello</p>'
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: []
        }
      ]
    },
    {
      // directly specify template literal to `template` component option at export default object
      code: `
      export default {
        template: \`<p>hello</p>\`
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: []
        }
      ]
    },
    {
      // directly specify string literal to `template` component option at variable
      code: `
      const Component = {
        template: '<p>hello</p>'
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: []
        }
      ]
    },
    {
      // directly specify template literal to `template` component option at variable
      code: `
      const Component = {
        template: \`<p>hello</p>\`
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 3,
          suggestions: []
        }
      ]
    },
    {
      // directly specify string literal to `template` variable
      code: `
      const template = '<p>hello</p>'
      const Component = {
        template
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 2,
          suggestions: []
        }
      ]
    },
    {
      // directly specify templtea literal to `template` variable
      code: `
      const template = \`<p>hello</p>\`
      const Component = {
        template
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 2,
          suggestions: []
        }
      ]
    },
    {
      // directly specify string literal to `template` variable
      code: `
      const template = '<p>{{ "hello" }}</p>'
      const Component = {
        template
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 2,
          column: 31,
          suggestions: []
        }
      ]
    },
    {
      // directly specify string literal to `template` variable
      code: `
      const template = '<p>{{ \`hello\` }}</p>'
      const Component = {
        template
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 2,
          column: 31,
          suggestions: []
        }
      ]
    },
    {
      // javascript expression specify string literal to `template` variable in mustache
      code: `
      const template = '<p>{{ ok ? "hello" : "world" }}</p>'
      const Component = {
        template
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 2,
          column: 36,
          suggestions: []
        },
        {
          message: `raw text 'world' is used`,
          line: 2,
          column: 46,
          suggestions: []
        }
      ]
    },
    {
      // javascript expression specify tempalte literal to `template` variable in mustache
      code: `
      const template = '<p>{{ ok ? \`hello\` : \`world\` }}</p>'
      const Component = {
        template
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 2,
          column: 36,
          suggestions: []
        },
        {
          message: `raw text 'world' is used`,
          line: 2,
          column: 46,
          suggestions: []
        }
      ]
    },
    {
      // directly specify string literal to JSX with `render`
      code: `
      const Component = {
        render () {
          return (<p>hello</p>)
        }
      }
    `,
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 4,
          suggestions: []
        }
      ]
    },
    {
      code: `
      <template>
        <md-icon>person</md-icon>
        <v-icon>menu</v-icon>
        <p>hello</p>
      </template>
    `,
      options: [{ ignoreNodes: ['md-icon', 'v-icon'] }],
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 5,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <md-icon>person</md-icon>
        <v-icon>menu</v-icon>
        <p>{{$t('hello')}}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      code: `
      <template>
        <p>{{ $t(\`foo\`) }}: {{ $t('bar') }}</p>
        <p>hello</p>
        <p> - </p>
        <p>@</p>
        <p>{{ true ? $t(\`ok\`) : ' - ' }}</p>
        <p>{{ true ? $t('ok') : '@' }}</p>
      </template>
    `,
      options: [{ ignorePattern: '^[-.#:()&]+$' }],
      errors: [
        {
          message: `raw text 'hello' is used`,
          line: 4,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<template>
        <p>{{ $t(\`foo\`) }}: {{ $t('bar') }}</p>
        <p>{{$t('hello')}}</p>
        <p> - </p>
        <p>@</p>
        <p>{{ true ? $t(\`ok\`) : ' - ' }}</p>
        <p>{{ true ? $t('ok') : '@' }}</p>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text '@' is used`,
          line: 6,
          column: 12,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "@": "@"
  }
}
</i18n>

<template>
        <p>{{ $t(\`foo\`) }}: {{ $t('bar') }}</p>
        <p>hello</p>
        <p> - </p>
        <p>{{$t('@')}}</p>
        <p>{{ true ? $t(\`ok\`) : ' - ' }}</p>
        <p>{{ true ? $t('ok') : '@' }}</p>
      </template>
    `
            }
          ]
        },
        {
          message: `raw text '@' is used`,
          line: 8,
          column: 33,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "@": "@"
  }
}
</i18n>

<template>
        <p>{{ $t(\`foo\`) }}: {{ $t('bar') }}</p>
        <p>hello</p>
        <p> - </p>
        <p>@</p>
        <p>{{ true ? $t(\`ok\`) : ' - ' }}</p>
        <p>{{ true ? $t('ok') : $t('@') }}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      code: `
      <template>
        <v-icon v-text="'mdi-check'" />
        <v-icon v-text="\`not\`" />
        <v-icon v-text="'ok'" />
        <v-icon v-html="'mdi-check'" />
        <v-icon v-html="'ok'" />
      </template>
    `,
      options: [
        {
          ignorePattern: '^mdi[-]|[-#:()/&]+$',
          ignoreText: ['ok']
        }
      ],
      errors: [
        {
          message: `raw text 'not' is used`,
          line: 4,
          column: 25,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "not": "not"
  }
}
</i18n>

<template>
        <v-icon v-text="'mdi-check'" />
        <v-icon v-text="$t(\`not\`)" />
        <v-icon v-text="'ok'" />
        <v-icon v-html="'mdi-check'" />
        <v-icon v-html="'ok'" />
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      code: `
      <template>
        <p>hello</p>
        <p>world</p>
      </template>
    `,
      options: [{ ignoreText: ['hello'] }],
      errors: [
        {
          message: `raw text 'world' is used`,
          line: 4,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "world": "world"
  }
}
</i18n>

<template>
        <p>hello</p>
        <p>{{$t('world')}}</p>
      </template>
    `
            }
          ]
        }
      ]
    },
    {
      code: `
      Vue.component('xxx', {
        template: 'Vue.component'
      })
      component('xxx', {
        template: 'component'
      })
      app.component('xxx', {
        template: 'app.component'
      })
      Vue.extend({
        template: 'Vue.extend'
      })
      defineComponent({
        template: 'defineComponent'
      })
      new Vue({
        template: 'new Vue'
      })
      createApp({
        template: 'createApp'
      })
      const MyButton = {
        template: 'MyComponent'
      }
      const foo = {
        components: {
          Foo: {
            template: 'components option'
          }
        }
      }
      // @vue/component
      const bar = {
        template: 'mark'
      }
      `,
      errors: [
        "raw text 'Vue.component' is used",
        "raw text 'component' is used",
        "raw text 'app.component' is used",
        "raw text 'Vue.extend' is used",
        "raw text 'defineComponent' is used",
        "raw text 'new Vue' is used",
        "raw text 'createApp' is used",
        "raw text 'MyComponent' is used",
        "raw text 'components option' is used",
        "raw text 'mark' is used"
      ]
    },
    {
      code: `
      <script>
      Vue.extend({
        template: "<p>foo</p>"
      })
      </script>`,
      errors: [
        {
          message: `raw text 'foo' is used`,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "foo": "foo"
  }
}
</i18n>

<script>
      Vue.extend({
        template: "<p>{{$t('foo')}}</p>"
      })
      </script>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <script>
      Vue.extend({
        template: '<p>foo</p>'
      })
      </script>`,
      errors: [
        {
          message: `raw text 'foo' is used`,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "foo": "foo"
  }
}
</i18n>

<script>
      Vue.extend({
        template: '<p>{{$t("foo")}}</p>'
      })
      </script>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <script>
      Vue.extend({
        template: '<p>\\\\foo</p>'
      })
      </script>`,
      errors: [
        {
          message: `raw text '\\foo' is used`,
          suggestions: []
        }
      ]
    },
    {
      code: `
      <script>
      Vue.extend({
        template: '<p>{{"foo"}}</p>'
      })
      </script>`,
      errors: [
        {
          message: `raw text 'foo' is used`,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "foo": "foo"
  }
}
</i18n>

<script>
      Vue.extend({
        template: '<p>{{$t("foo")}}</p>'
      })
      </script>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <script>
      Vue.extend({
        template: '<p>{{"\\\\"foo"}}</p>'
      })
      </script>`,
      errors: [
        {
          message: `raw text '"foo' is used`,
          suggestions: []
        }
      ]
    },
    {
      code: `
      <script>
      const Component = {
        render () {
          return (<p>hello</p>)
        }
      }
      </script>`,
      errors: [
        {
          message: `raw text 'hello' is used`,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "hello": "hello"
  }
}
</i18n>

<script>
      const Component = {
        render () {
          return (<p>{$t('hello')}</p>)
        }
      }
      </script>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <i18n>
      {
        "ja": {
          "hello": "こんにちは"
        },
        "en": {"hello": "hello"},
        "zh": {}
      }
      </i18n>
      <template>
        <p>foo</p>
      </template>`,
      errors: [
        {
          message: `raw text 'foo' is used`,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
      {
        "ja": {
          "foo": "foo",
          "hello": "こんにちは"
        },
        "en": {
          "foo": "foo",
          "hello": "hello"},
        "zh": {
          "foo": "foo"}
      }
      </i18n>
      <template>
        <p>{{$t('foo')}}</p>
      </template>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <i18n>
      {
        "ja": {
          "hello": "こんにちは"
        },
        "en": {"hello": "hello"},
        "zh": {}
      }
      </i18n>
      <template>
        <p>こんにちは</p>
      </template>`,
      errors: [
        {
          message: `raw text 'こんにちは' is used`,
          suggestions: [
            {
              desc: `Replace to "{{$t('hello')}}".`,
              output: `
      <i18n>
      {
        "ja": {
          "hello": "こんにちは"
        },
        "en": {"hello": "hello"},
        "zh": {}
      }
      </i18n>
      <template>
        <p>{{$t('hello')}}</p>
      </template>`
            },
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
      {
        "ja": {
          "こんにちは": "こんにちは",
          "hello": "こんにちは"
        },
        "en": {
          "こんにちは": "こんにちは",
          "hello": "hello"},
        "zh": {
          "こんにちは": "こんにちは"}
      }
      </i18n>
      <template>
        <p>{{$t('こんにちは')}}</p>
      </template>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <i18n>
      {
        "ja": {
          "hello": "こんにちは"
        },
        "en": {"hello": "hello"},
        "zh": {}
      }
      </i18n>
      <template>
        <p>{{'こんにちは'}}</p>
      </template>`,
      errors: [
        {
          message: `raw text 'こんにちは' is used`,
          suggestions: [
            {
              desc: `Replace to "$t('hello')".`,
              output: `
      <i18n>
      {
        "ja": {
          "hello": "こんにちは"
        },
        "en": {"hello": "hello"},
        "zh": {}
      }
      </i18n>
      <template>
        <p>{{$t('hello')}}</p>
      </template>`
            },
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
      {
        "ja": {
          "こんにちは": "こんにちは",
          "hello": "こんにちは"
        },
        "en": {
          "こんにちは": "こんにちは",
          "hello": "hello"},
        "zh": {
          "こんにちは": "こんにちは"}
      }
      </i18n>
      <template>
        <p>{{$t('こんにちは')}}</p>
      </template>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <template>
        <my-input label="raw" />
        <other-input label='raw' />
      </template>`,
      options: [
        {
          attributes: {
            '/.*/': ['label']
          }
        }
      ],
      errors: [
        {
          message: "raw text 'raw' is used",
          line: 3,
          column: 25,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "raw": "raw"
  }
}
</i18n>

<template>
        <my-input :label="$t('raw')" />
        <other-input label='raw' />
      </template>`
            }
          ]
        },
        {
          message: "raw text 'raw' is used",
          line: 4,
          column: 28,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "raw": "raw"
  }
}
</i18n>

<template>
        <my-input label="raw" />
        <other-input :label='$t("raw")' />
      </template>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <template>
        <my-input label="raw" />
        <other-input label='raw' />
      </template>`,
      options: [
        {
          attributes: {
            'my-input': ['label']
          }
        }
      ],
      errors: [
        {
          message: "raw text 'raw' is used",
          line: 3,
          column: 25,
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "raw": "raw"
  }
}
</i18n>

<template>
        <my-input :label="$t('raw')" />
        <other-input label='raw' />
      </template>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <i18n locale="en">
      {
        "hello": "Hello!"
      }
      </i18n>
      <template>
        <my-input label='Hello!' />
      </template>`,
      options: [
        {
          attributes: {
            'my-input': ['label']
          }
        }
      ],
      errors: [
        {
          message: "raw text 'Hello!' is used",
          suggestions: [
            {
              desc: `Replace to "$t('hello')".`,
              output: `
      <i18n locale="en">
      {
        "hello": "Hello!"
      }
      </i18n>
      <template>
        <my-input :label='$t("hello")' />
      </template>`
            },
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n locale="en">
      {
        "Hello!": "Hello!",
        "hello": "Hello!"
      }
      </i18n>
      <template>
        <my-input :label='$t("Hello!")' />
      </template>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <script>
      export default {
        template: "<my-input label='Hello!' >Hello!</my-input>"
      }
      </script>`,
      options: [
        {
          attributes: {
            'my-input': ['label']
          }
        }
      ],
      errors: [
        {
          message: "raw text 'Hello!' is used",
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "Hello!": "Hello!"
  }
}
</i18n>

<script>
      export default {
        template: "<my-input :label='$t(\`Hello!\`)' >Hello!</my-input>"
      }
      </script>`
            }
          ]
        },
        {
          message: "raw text 'Hello!' is used",
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "Hello!": "Hello!"
  }
}
</i18n>

<script>
      export default {
        template: "<my-input label='Hello!' >{{$t('Hello!')}}</my-input>"
      }
      </script>`
            }
          ]
        }
      ]
    },
    {
      code: `
      <script>
      export default {
        template: '<my-input label="Hello!" >Hello!</my-input>'
      }
      </script>`,
      options: [
        {
          attributes: {
            'my-input': ['label']
          }
        }
      ],
      errors: [
        {
          message: "raw text 'Hello!' is used",
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "Hello!": "Hello!"
  }
}
</i18n>

<script>
      export default {
        template: '<my-input :label="$t(\`Hello!\`)" >Hello!</my-input>'
      }
      </script>`
            }
          ]
        },
        {
          message: "raw text 'Hello!' is used",
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n>
{
  "en": {
    "Hello!": "Hello!"
  }
}
</i18n>

<script>
      export default {
        template: '<my-input label="Hello!" >{{$t("Hello!")}}</my-input>'
      }
      </script>`
            }
          ]
        }
      ]
    },
    {
      // null value
      code: `
      <i18n locale="en">{ "foo": null, "bar": 123 }</i18n>
      <template>Hello!</template>`,
      errors: [
        {
          message: "raw text 'Hello!' is used",
          suggestions: [
            {
              desc: "Add the resource to the '<i18n>' block.",
              output: `
      <i18n locale="en">{
        "Hello!": "Hello!",
         "foo": null, "bar": 123 }</i18n>
      <template>{{$t('Hello!')}}</template>`
            }
          ]
        }
      ]
    }
  ]
})
