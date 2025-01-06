---
title: 'vue-i18n-ex/no-deprecated-modulo-syntax'
description: enforce modulo interpolation to be named interpolation
since: v3.0.0
---

# vue-i18n-ex/no-deprecated-modulo-syntax

> enforce modulo interpolation to be named interpolation

- :star: The `"extends": "plugin:vue-i18n-ex/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

This rule enforces modulo interpolation to be named interpolation

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

locale messages:

<eslint-code-block fix language="json">

```json
/* eslint vue-i18n-ex/no-deprecated-modulo-syntax: 'error' */
{
  /* ✗ BAD */
  "hello": "%{msg} world"
}
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

locale messages (for vue-i18n-ex v9+):

<eslint-code-block fix message-syntax-version="^9" language="json">

```json
/* eslint vue-i18n-ex/no-deprecated-modulo-syntax: 'error' */
{
  /* ✓ GOOD */
  "hello": "{msg} world"
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `eslint-plugin-vue-i18n-ex` v3.0.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/blob/master/lib/rules/no-deprecated-modulo-syntax.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n-ex/tree/master/tests/lib/rules/no-deprecated-modulo-syntax.ts)
