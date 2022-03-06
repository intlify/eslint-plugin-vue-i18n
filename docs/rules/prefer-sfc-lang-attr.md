---
title: '@intlify/vue-i18n/prefer-sfc-lang-attr'
description: require lang attribute on `<i18n>` block
since: v1.2.0
---

# @intlify/vue-i18n/prefer-sfc-lang-attr

> require lang attribute on `<i18n>` block

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule enforce `lang` attribute to be specified to `<i18n>` custom block.

:-1: Examples of **incorrect** code for this rule:

locale messages:

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<i18n>
{
  "en": {
    "message": "hello!"
  }
}
</i18n>
<script>
/* eslint @intlify/vue-i18n/prefer-sfc-lang-attr: 'error' */
</script>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

locale messages:

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<i18n lang="json">
{
  "en": {
    "message": "hello!"
  }
}
</i18n>
<script>
/* eslint @intlify/vue-i18n/prefer-sfc-lang-attr: 'error' */
</script>
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v1.2.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/prefer-sfc-lang-attr.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/prefer-sfc-lang-attr.ts)
