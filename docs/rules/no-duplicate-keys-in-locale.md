---
title: '@intlify/vue-i18n/no-duplicate-keys-in-locale'
description: disallow duplicate localization keys within the same locale
since: v0.9.0
---

# @intlify/vue-i18n/no-duplicate-keys-in-locale

> disallow duplicate localization keys within the same locale

If you manage localization messages in multiple files, duplicate localization keys across multiple files can cause unexpected problems.

## :book: Rule Details

This rule reports duplicate localization keys within the same locale.

:-1: Examples of **incorrect** code for this rule:

locale messages:

- `en.1.json`

<resource-group>

<eslint-code-block language="json" filename="en.1.json">

```json
/* eslint @intlify/vue-i18n/no-duplicate-keys-in-locale: 'error' */

// ✗ BAD
{
  "hello": "Hello! DIO!", // duplicate.
  "hello": "Hello! DIO!", // duplicate.
  "good-bye": "Good bye! DIO!"
}
```

</eslint-code-block>

- `en.2.json`

<eslint-code-block language="json" filename="en.2.json">

```json
/* eslint @intlify/vue-i18n/no-duplicate-keys-in-locale: 'error' */

// ✗ BAD
{
  "good-bye": "Good bye! DIO!" // This same key exists in `en.1.json`.
}
```

</eslint-code-block>

</resource-group>

:+1: Examples of **correct** code for this rule:

locale messages:

- `en.1.json`

<resource-group>

<eslint-code-block language="json" filename="en.1.json">

```json
/* eslint @intlify/vue-i18n/no-duplicate-keys-in-locale: 'error' */

// ✓ GOOD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!"
}
```

</eslint-code-block>

- `en.2.json`

<eslint-code-block language="json" filename="en.2.json">

```json
/* eslint @intlify/vue-i18n/no-duplicate-keys-in-locale: 'error' */

// ✓ GOOD
{
  "good-bye": "Good bye! DIO!"
}
```

</eslint-code-block>

</resource-group>

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-duplicate-keys-in-locale": [
    "error",
    {
      "ignoreI18nBlock": false
    }
  ]
}
```

- `ignoreI18nBlock`: If `true`, do not report key duplication between `<i18n>` blocks and other files, it set to `false` as default.

## :couple: Related Rules

- [@intlify/vue-i18n/no-missing-keys-in-other-locales](./no-missing-keys-in-other-locales.md)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-duplicate-keys-in-locale.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-duplicate-keys-in-locale.ts)
