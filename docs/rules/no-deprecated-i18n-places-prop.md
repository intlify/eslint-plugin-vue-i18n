---
title: '@intlify/vue-i18n/no-deprecated-i18n-places-prop'
description: disallow using deprecated `places` prop (Removed in Vue I18n 9.0.0+)
since: v0.11.0
---

# @intlify/vue-i18n/no-deprecated-i18n-places-prop

> disallow using deprecated `places` prop (Removed in Vue I18n 9.0.0+)

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

If you are migrating from Vue I18n v8 to v9, the `places` prop should be replaced with the `v-slot`.

## :book: Rule Details

This rule reports use of deprecated `places` prop (Removed in Vue I18n 9.0.0+).

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-i18n-places-prop: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <i18n path="info" tag="p" :places="{ limit: changeLimit }">
      <a place="action" :href="changeUrl">{{ $t('change') }}</a>
    </i18n>

    <!-- Also check the <i18n-t> component to prevent mistakes. -->
    <!-- ✗ BAD -->
    <i18n-t path="info" tag="p" :places="{ limit: changeLimit }">
      <a place="action" :href="changeUrl">{{ $t('change') }}</a>
    </i18n-t>
  </div>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-deprecated-i18n-places-prop: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <i18n path="info" tag="p">
      <template v-slot:limit>
        <span>{{ changeLimit }}</span>
      </template>
      <template v-slot:action>
        <a :href="changeUrl">{{ $t('change') }}</a>
      </template>
    </i18n>

    <!-- ✓ GOOD -->
    <i18n-t keypath="info" tag="p">
      <template #limit>
        <span>{{ changeLimit }}</span>
      </template>
      <template #action>
        <a :href="changeUrl">{{ $t('change') }}</a>
      </template>
    </i18n-t>
  </div>
</template>
```

</eslint-code-block>

## :books: Further reading

- [Vue I18n > Breaking Changes - Remove place syntax with `place` attr and `places` prop](https://vue-i18n.intlify.dev/guide/migration/breaking.html#remove-place-syntax-with-place-attr-and-places-prop)
- [Vue I18n (v8) > Component interpolation - Places syntax usage](https://kazupon.github.io/vue-i18n/guide/interpolation.html#places-syntax-usage)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.11.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-deprecated-i18n-places-prop.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-deprecated-i18n-places-prop.ts)
