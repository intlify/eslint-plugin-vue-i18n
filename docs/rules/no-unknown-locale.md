---
title: '@intlify/vue-i18n/no-unknown-locale'
description: disallow unknown locale name
since: v1.3.0
---

# @intlify/vue-i18n/no-unknown-locale

> disallow unknown locale name

## :book: Rule Details

This rule reports the use of unknown locale names.

By default, this rule only commonly known locale names specified in [RFC 5646] are allowed.
The rule uses the [is-language-code] package to check if the locale name is compatible with [RFC 5646].

[rfc 5646]: https://datatracker.ietf.org/doc/html/rfc5646
[is-language-code]: https://www.npmjs.com/package/is-language-code

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-unknown-locale: "error" */
</script>

<!-- ✓ GOOD -->
<i18n locale="en">
{
  "hello": "Hello!"
}
</i18n>

<!-- ✗ BAD -->
<i18n locale="foo">
{
  "hello": "Foo!"
}
</i18n>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-unknown-locale": [
    "error",
    {
      "locales": [],
      "disableRFC5646": false
    }
  ]
}
```

- `locales` ... Specify the locale names you want to use specially in an array. The rule excludes the specified name from the check.
- `disableRFC5646` ... If `true`, only the locale names listed in `locales` are allowed.

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-unknown-locale.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-unknown-locale.ts)
