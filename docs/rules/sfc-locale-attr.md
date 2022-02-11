---
title: '@intlify/vue-i18n/sfc-locale-attr'
description: require or disallow the locale attribute on `<i18n>` block
since: v1.3.0
---

# @intlify/vue-i18n/sfc-locale-attr

> require or disallow the locale attribute on `<i18n>` block

## :book: Rule Details

This rule aims to enforce the `<i18n>` block to use or not the `locale` attribute.

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/sfc-locale-attr: "error" */
</script>

<!-- ✓ GOOD -->
<i18n locale="en">
{
  "message": "hello!"
}
</i18n>

<!-- ✗ BAD -->
<i18n>
{
  "en": {
    "message": "hello!"
  }
}
</i18n>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@intlify/vue-i18n/sfc-locale-attr": [
    "error",
    "always" //"always" or "never"
  ]
}
```

- `"always"` ... The `<i18n>` blocks requires the locale attribute.
- `"never"` ... Do not use the locale attribute on `<i18n>` blocks.

### Examples of code for this rule with `"never"` option:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/sfc-locale-attr: ["error", "never"] */
</script>

<!-- ✓ GOOD -->
<i18n>
{
  "en": {
    "message": "hello!"
  }
}
</i18n>

<!-- ✗ BAD -->
<i18n locale="en">
{
  "message": "hello!"
}
</i18n>
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/sfc-locale-attr.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/sfc-locale-attr.ts)
