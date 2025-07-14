---
title: '@intlify/vue-i18n/no-deprecated-v-t'
description: disallow using deprecated `v-t` custom directive (Deprecated in Vue I18n 11.0.0, removed fully in Vue I18n 12.0.0)
since: v3.2.0
---

# @intlify/vue-i18n/no-deprecated-v-t

> disallow using deprecated `v-t` custom directive (Deprecated in Vue I18n 11.0.0, removed fully in Vue I18n 12.0.0)

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

If you are migrating from Vue I18n v10 to v11, `v-t` custom directive should be replaced with `t` or `$t`.

## :book: Rule Details

This rule reports use of deprecated `v-t` custom directive (Deprecated in Vue I18n 11.0.0, removed fully in Vue I18n 12.0.0)

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-v-t: 'error' */
</script>
<template>
  <!-- ✗ BAD -->
  <p v-t="'banana'"></p>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-v-t: 'error' */
</script>
<template>
  <!-- ✓ GOOD -->
  <p>{{ $t('banana') }}</p>
</template>
```

</eslint-code-block>

## :books: Further reading

- [Vue I18n > Breaking Changes in v11 - Deprecate Custom Directive `v-t`](https://vue-i18n.intlify.dev/guide/migration/breaking11.html#deprecate-custom-directive-v-t)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v3.2.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-deprecated-v-t.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-deprecated-v-t.ts)
