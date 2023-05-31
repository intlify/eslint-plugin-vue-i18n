---
title: '@intlify/vue-i18n/no-unused-keys'
description: disallow unused localization keys
since: v0.1.0
---

# @intlify/vue-i18n/no-unused-keys

> disallow unused localization keys

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

Localization keys that not used anywhere in the code are most likely an error due to incomplete refactoring. Such localization keys take up code size and can lead to confusion by readers.

## :book: Rule Details

This rule is aimed at eliminating unused localization keys.

:-1: Examples of **incorrect** code for this rule:

locale messages:

<resource-group>

<eslint-code-block fix language="json" filename="en.json">

```json
/* eslint @intlify/vue-i18n/no-unused-keys: 'error' */

// ✗ BAD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!" // not used in application
}
```

</eslint-code-block>

In localization codes of application:

<eslint-code-block fix>

```vue
<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
  </div>
</template>
```

</eslint-code-block>

<eslint-code-block fix language="javascript">

```js
import VueI18n from 'vue-i18n'

import en from './locales/en.json'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
})

i18n.t('hello')
```

</eslint-code-block>

</resource-group>

For SFC.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-unused-keys: 'error' */
</script>
<i18n>
{
  "en": {
    "hello": "Hello! DIO!",
    "hi": "Hi! DIO!" // not used in SFC
  }
}
</i18n>

<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
  </div>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

locale messages:

<resource-group>

<eslint-code-block fix language="json" filename="en.json">

```json
/* eslint @intlify/vue-i18n/no-unused-keys: 'error' */

// ✓ GOOD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!"
}
```

</eslint-code-block>

In localization codes of application:

<eslint-code-block fix>

```vue
<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
  </div>
</template>
```

</eslint-code-block>

<eslint-code-block fix language="javascript">

```js
import VueI18n from 'vue-i18n'

import en from './locales/en.json'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en
  }
})

i18n.t('hi')
```

</eslint-code-block>

</resource-group>

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-unused-keys": [
    "error",
    {
      "src": "./src",
      "extensions": [".js", ".vue"],
      "ignores": [],
      "enableFix": false
    }
  ]
}
```

- `src`: specify the source codes directory to be able to lint. If you don't set any options, it set to `process.cwd()` as default.
- `extensions`: an array to allow specified lintable target file extension. If you don't set any options, it set to `.js` and `.vue` as default.
- `ignores`: An array of key names and patterns to exclude from the check. If you want to specify a pattern, specify a string such as `/pattern/`.
- `enableFix`: if `true`, enable automatically remove unused keys on `eslint --fix`. If you don't set any options, it set to `false` as default. (This is an experimental feature.)

## :couple: Related Rules

- [@intlify/vue-i18n/no-missing-keys-in-other-locales](./no-missing-keys-in-other-locales.md)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-unused-keys.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-unused-keys.ts)
