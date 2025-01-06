---
title: '@intlify/vue-i18n/no-deprecated-i18n-component'
description: disallow using deprecated `<i18n>` components (in Vue I18n 9.0.0+)
since: v0.11.0
---

# @intlify/vue-i18n/no-deprecated-i18n-component

> disallow using deprecated `<i18n>` components (in Vue I18n 9.0.0+)

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

If you are migrating from Vue I18n v8 to v9, the `<i18n>` component should be replaced with the `<i18n-t>` component.

## :book: Rule Details

This rule reports use of deprecated `<i18n>` components (in Vue I18n 9.0.0+).

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-i18n-component: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <i18n path="message.greeting" />
  </div>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-i18n-component: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <i18n-t keypath="message.greeting" />
  </div>
</template>
```

</eslint-code-block>

## :books: Further reading

- [Vue I18n > Breaking Changes - Rename to `i18n-t` from `i18n`](https://vue-i18n.intlify.dev/guide/migration/breaking.html#rename-to-i18n-tfrom-i18n)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.11.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-deprecated-i18n-component.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-deprecated-i18n-component.ts)
