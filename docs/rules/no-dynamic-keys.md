---
title: '@intlify/vue-i18n/no-dynamic-keys'
description: disallow localization dynamic keys at localization methods
since: v0.1.0
---

# @intlify/vue-i18n/no-dynamic-keys

> disallow localization dynamic keys at localization methods

This rule warns localization dynamic keys.

This role is useful for unifying all static keys in your application.

## :book: Rule Details

You can be detected with this rule the following:

- `$t`
- `t`
- `$tc`
- `tc`
- `v-t`
- `<i18n>`

:-1: Examples of **incorrect** code for this rule:

locale messages:

```json
{
  "hello": "Hello! DIO!"
}
```

localization codes:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-dynamic-keys: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <p>{{ $t(msg) }}</p>
    <!-- ✗ BAD -->
    <p v-t="msg"></p>
    <!-- ✗ BAD -->
    <i18n :path="msg"></i18n>
  </div>
</template>
```

</eslint-code-block>

<eslint-code-block language='javascript'>

<!-- eslint-skip -->

```js
/* eslint @intlify/vue-i18n/no-dynamic-keys: 'error' */
import Vue from 'vue'
import VueI18n from 'vue-i18n'

import en from './locales/en.json'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
})

const app = new Vue({
  i18n,
  data() {
    return { msg: 'hello' }
  }
})

/* ✗ BAD */
i18n.t(app.msg)
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

locale messages:

```json
{
  "hello": "Hello! DIO!"
}
```

localization codes:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-dynamic-keys: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <p>{{ $t('hello') }}</p>
    <!-- ✓ GOOD -->
    <p v-t="'hello'"></p>
    <!-- ✓ GOOD -->
    <i18n path="hello"></i18n>
  </div>
</template>
```

</eslint-code-block>

<eslint-code-block language='javascript'>

<!-- eslint-skip -->

```js
/* eslint @intlify/vue-i18n/no-dynamic-keys: 'error' */
import Vue from 'vue'
import VueI18n from 'vue-i18n'

import en from './locales/en.json'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
})

new Vue({
  i18n,
  data() {
    return { msg: 'hello' }
  }
})

/* ✓ GOOD */
i18n.t('hello')
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-dynamic-keys.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-dynamic-keys.ts)
