---
title: 'vue-i18n-ex/no-missing-keys'
description: disallow missing locale message key at localization methods
since: v0.1.0
---

# vue-i18n-ex/no-missing-keys

> disallow missing locale message key at localization methods

- :star: The `"extends": "plugin:vue-i18n-ex/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

This rule warns locale message key missing if the key does not exist in locale messages.

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

<resource-group>

<eslint-code-block language="json" filename="en.json">

```json
{
  "hello": "Hello! DIO!"
}
```

</eslint-code-block>

localization codes:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint vue-i18n-ex/no-missing-keys: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <p>{{ $t('hi') }}</p>
    <!-- ✗ BAD -->
    <p v-t="'hi'"></p>
    <!-- ✗ BAD -->
    <i18n path="hi" tag="p"></i18n>
  </div>
</template>
```

</eslint-code-block>

<eslint-code-block language="javascript">

<!-- eslint-skip -->

```js
/* eslint vue-i18n-ex/no-missing-keys: 'error' */
import VueI18n from 'vue-i18n-ex'

import en from './locales/en.json'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
})

/* ✗ BAD */
i18n.t('hi')
```

</eslint-code-block>

</resource-group>

:+1: Examples of **correct** code for this rule:

locale messages:

<resource-group>

<eslint-code-block language="json" filename="en.json">

```json
{
  "hello": "Hello! DIO!"
}
```

</eslint-code-block>

localization codes:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint vue-i18n-ex/no-missing-keys: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <p>{{ $t('hello') }}</p>
    <!-- ✓ GOOD -->
    <p v-t="'hello'"></p>
    <!-- ✓ GOOD -->
    <i18n path="hello" tag="p"></i18n>
  </div>
</template>
```

</eslint-code-block>

<eslint-code-block language="javascript">

<!-- eslint-skip -->

```js
/* eslint vue-i18n-ex/no-missing-keys: 'error' */
import VueI18n from 'vue-i18n-ex'

import en from './locales/en.json'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
})

/* ✓ GOOD */
i18n.t('hello')
```

</eslint-code-block>

</resource-group>

For SFC.

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint vue-i18n-ex/no-missing-keys: 'error' */
</script>

<i18n>
{
  "en": {
    "hi": "Hi! DIO!"
  }
}
</i18n>

<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <p>{{ $t('hi') }}</p>
  </div>
</template>
```

</eslint-code-block>

## :couple: Related Rules

- [vue-i18n-ex/no-missing-keys-in-other-locales](./no-missing-keys-in-other-locales.md)
- [vue-i18n-ex/no-unused-keys](./no-unused-keys.md)

## :rocket: Version

This rule was introduced in `eslint-plugin-vue-i18n-ex` v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/blob/master/lib/rules/no-missing-keys.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/tree/master/tests/lib/rules/no-missing-keys.ts)
