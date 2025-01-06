---
title: 'vue-i18n-ex/prefer-linked-key-with-paren'
description: enforce linked key to be enclosed in parentheses
since: v0.10.0
---

# vue-i18n-ex/prefer-linked-key-with-paren

> enforce linked key to be enclosed in parentheses

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

This rule enforces the linked message key to be enclosed in parentheses.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

locale messages:

<eslint-code-block fix language="json">

```json
/* eslint vue-i18n-ex/prefer-linked-key-with-paren: 'error' */
{
  /* ✗ BAD */
  "hello": "Hello @:world",
  "world": "world"
}
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

locale messages (for vue-i18n-ex v9+):

<eslint-code-block fix message-syntax-version="^9" language="json">

```json
/* eslint vue-i18n-ex/prefer-linked-key-with-paren: 'error' */
{
  /* ✓ GOOD */
  "hello": "Hello @:{'world'}",
  "world": "world"
}
```

</eslint-code-block>

locale messages (for vue-i18n-ex v8):

<eslint-code-block fix message-syntax-version="^8" language="json">

```json
/* eslint vue-i18n-ex/prefer-linked-key-with-paren: 'error' */
{
  /* ✓ GOOD */
  "hello": "Hello @:(world)",
  "world": "world"
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `eslint-plugin-vue-i18n-ex` v0.10.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/blob/master/lib/rules/prefer-linked-key-with-paren.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/tree/master/tests/lib/rules/prefer-linked-key-with-paren.ts)
