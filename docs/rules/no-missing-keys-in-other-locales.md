---
title: 'vue-i18n-ex/no-missing-keys-in-other-locales'
description: disallow missing locale message keys in other locales
since: v0.10.0
---

# vue-i18n-ex/no-missing-keys-in-other-locales

> disallow missing locale message keys in other locales

This rule warns if a key with the same path as the key of resource does not exist in another locale.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

locale messages:

<resource-group>

<eslint-code-block language="json" locale-key="key">

```json
/* eslint vue-i18n-ex/no-missing-keys-in-other-locales: 'error' */

{
  "en": {
    /* ✓ GOOD */
    "hello": "Hello!",
    /* ✗ BAD */
    "goodbye": "Goodbye!"
  },
  "ja": {
    "hello": "こんにちは!"
  }
}
```

</eslint-code-block>

</resource-group>

:+1: Examples of **correct** code for this rule:

locale messages:

<resource-group>

<eslint-code-block language="json" locale-key="key">

```json
/* eslint vue-i18n-ex/no-missing-keys-in-other-locales: 'error' */

{
  "en": {
    /* ✓ GOOD */
    "hello": "Hello!",
    "goodbye": "Goodbye!"
  },
  "ja": {
    "hello": "こんにちは!",
    "goodbye": "さようなら!"
  }
}
```

</eslint-code-block>

</resource-group>

## :gear: Options

```json
{
  "vue-i18n-ex/no-missing-keys-in-other-locales": [
    "error",
    {
      "ignoreLocales": []
    }
  ]
}
```

- `ignoreLocales`: If you specify an array of locales, that locale is allowed even if it is missing.

## :couple: Related Rules

- [vue-i18n-ex/no-duplicate-keys-in-locale](./no-duplicate-keys-in-locale.md)
- [vue-i18n-ex/no-missing-keys](./no-missing-keys.md)

## :rocket: Version

This rule was introduced in `eslint-plugin-vue-i18n-ex` v0.10.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/blob/master/lib/rules/no-missing-keys-in-other-locales.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/tree/master/tests/lib/rules/no-missing-keys-in-other-locales.ts)
