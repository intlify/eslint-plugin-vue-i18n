---
title: '@intlify/vue-i18n/no-i18n-t-path-prop'
description: disallow using `path` prop with `<i18n-t>`
since: v0.11.0
---

# @intlify/vue-i18n/no-i18n-t-path-prop

> disallow using `path` prop with `<i18n-t>`

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

You cannot use `path` prop with `<i18n-t>` component. Perhaps it's an old habit mistake.

## :book: Rule Details

This rule reports use of `path` prop with `<i18n-t>` component.

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-i18n-t-path-prop: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <i18n-t path="message.greeting" />
  </div>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-i18n-t-path-prop: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <i18n-t keypath="message.greeting" />

    <!-- ✓ GOOD -->
    <i18n path="message.greeting" />
  </div>
</template>
```

</eslint-code-block>

## :books: Further reading

- [Vue I18n > Breaking Changes - Rename to `keypath` prop from `path` prop](https://vue-i18n.intlify.dev/guide/migration/breaking.html#rename-to-keypath-prop-from-path-prop)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.11.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-i18n-t-path-prop.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-i18n-t-path-prop.ts)
