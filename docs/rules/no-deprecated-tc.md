---
title: '@intlify/vue-i18n/no-deprecated-tc'
description: disallow using deprecated `tc` or `$tc` (Deprecated in Vue I18n 10.0.0, removed fully in Vue I18n 11.0.0)
since: v3.0.0
---

# @intlify/vue-i18n/no-deprecated-tc

> disallow using deprecated `tc` or `$tc` (Deprecated in Vue I18n 10.0.0, removed fully in Vue I18n 11.0.0)

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

If you are migrating from Vue I18n v9 to v10, `tc` or `$tc` should be replaced with `t` or `$t`.

## :book: Rule Details

This rule reports use of deprecated `tc` or `$tc` (Deprecated in Vue I18n 10.0.0, removed fully in Vue I18n 11.0.0)

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-tc: 'error' */
</script>
<template>
  <!-- ✗ BAD -->
  <p>{{ $tc('banana') }}</p>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-tc: 'error' */
</script>
<template>
  <!-- ✓ GOOD -->
  <p>{{ $t('banana', 1) }}</p>
</template>
```

</eslint-code-block>

## :books: Further reading

- [Vue I18n > Breaking Changes in v10 - Deprecate tc and $tc for Legacy API mode](https://vue-i18n.intlify.dev/guide/migration/breaking10.html#deprecate-tc-and-tc-for-legacy-api-mode)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v3.0.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-deprecated-tc.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-deprecated-tc.ts)
