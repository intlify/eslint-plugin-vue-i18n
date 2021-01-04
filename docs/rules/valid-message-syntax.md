---
title: @intlify/vue-i18n/valid-message-syntax
description: disallow invalid message syntax
---
# @intlify/vue-i18n/valid-message-syntax

> disallow invalid message syntax

This rule warns invalid message syntax.

This rule is useful localization leaks with incorrect message syntax.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block language="json">

```json5
/* eslint @intlify/vue-i18n/valid-message-syntax: 'error' */

/* ✗ BAD */
{
  "list-hello": "Hello! {{0}}",
  "named-hello": "Hello! {{name}}",
}
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block language="json">

```json5
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

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/valid-message-syntax.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/valid-message-syntax.ts)
