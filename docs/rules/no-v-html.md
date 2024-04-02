---
title: '@intlify/vue-i18n/no-v-html'
description: disallow use of localization methods on v-html to prevent XSS attack
since: v0.1.0
---

# @intlify/vue-i18n/no-v-html

> disallow use of localization methods on v-html to prevent XSS attack

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

This rule reports all uses of localization methods on `v-html` directive in order to reduce the risk of injecting potentially unsafe / unescaped html into the browser leading to Cross-Site Scripting (XSS) attacks.

## :book: Rule Details

You can be detected with this rule the following:

- `$t`
- `t`
- `$tc`
- `tc`

:-1: Examples of **incorrect** code for this rule:

locale messages:

```json
{
  "term": "<p>I accept xxx <a href=\"/term\">Terms of Service Agreement</a></p>"
}
```

localization codes:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-v-html: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <p v-html="$t('term')"></p>
  </div>
</template>
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

locale messages:

```json
{
  "tos": "Term of Service",
  "term": "I accept xxx {0}."
}
```

localization codes:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-v-html: 'error' */
</script>
<template>
  <div class="app">
    <!-- ✗ GOOD -->
    <i18n path="term" tag="label" for="tos">
      <a :href="url" target="_blank">{{ $t('tos') }}</a>
    </i18n>
  </div>
</template>
```

</eslint-code-block>

## :mute: When Not To Use It

If you are certain the content passed to `v-html` is trusted HTML you can disable this rule.

## :books: Further reading

- [XSS in Vue.js](https://blog.sqreen.io/xss-in-vue-js/)

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-v-html.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-v-html.ts)
