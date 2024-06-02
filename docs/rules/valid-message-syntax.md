---
title: '@intlify/vue-i18n/valid-message-syntax'
description: disallow invalid message syntax
since: v0.10.0
---

# @intlify/vue-i18n/valid-message-syntax

> disallow invalid message syntax

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

This rule warns invalid message syntax.

This rule is useful localization leaks with incorrect message syntax.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block language="json">

```json
/* eslint @intlify/vue-i18n/valid-message-syntax: 'error' */

/* ✗ BAD */
{
  "list-hello": "Hello! {{0}}",
  "named-hello": "Hello! {{name}}"
}
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block language="json">

```json
/* eslint @intlify/vue-i18n/valid-message-syntax: 'error' */

/* ✓ GOOD */
{
  "list-hello": "Hello! {0}",
  "named-hello": "Hello! {name}",
  "linked-hello": "@:list-hello"
}
```

</eslint-code-block>

## :couple: Related Rules

- [@intlify/vue-i18n/no-html-messages](./no-html-messages.md)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.10.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/valid-message-syntax.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/valid-message-syntax.ts)
