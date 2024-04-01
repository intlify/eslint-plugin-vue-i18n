---
title: '@intlify/vue-i18n/no-raw-text'
description: disallow to string literal in template or JSX
since: v0.2.0
---

# @intlify/vue-i18n/no-raw-text

> disallow to string literal in template or JSX

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` or `*.configs["flat/recommended"]` property in a configuration file enables this rule.

This rule warns the usage of literal the bellow:

- string literal
- template literals (no epressions, plain text only)

This rule encourage i18n in about the application needs to be localized.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

`template` option:

<eslint-code-block language="javascript">

<!-- eslint-skip -->

```js
/* eslint @intlify/vue-i18n/no-raw-text: 'error' */
export default Vue.extend({
  // ✗ BAD
  template: '<p>hello</p>'
  // ...
})
```

</eslint-code-block>

`template` block of single-file components:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-raw-text: 'error' */
</script>
<template>
  <!-- ✗ BAD -->
  <p>hello</p>
</template>
```

</eslint-code-block>

`JSX`:

<eslint-code-block language="javascript">

<!-- eslint-skip -->

```js
/* eslint @intlify/vue-i18n/no-raw-text: 'error' */
export default {
  // ✗ BAD
  render: h => <p>hello</p>
  // ...
}
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

`template` option:

<eslint-code-block language="javascript">

<!-- eslint-skip -->

```js
/* eslint @intlify/vue-i18n/no-raw-text: 'error' */
export default Vue.extend({
  // ✓ GOOD
  template: `<p>{{ \$t('hello') }}</p>`
  // ...
})
```

</eslint-code-block>

`template` block of single-file components:

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-raw-text: 'error' */
</script>
<template>
  <!-- ✓ GOOD -->
  <p>{{ $t('hello') }}</p>
</template>
```

</eslint-code-block>

`JSX`:

<eslint-code-block language="javascript">

<!-- eslint-skip -->

```js
/* eslint @intlify/vue-i18n/no-raw-text: 'error' */
export default {
  // ✓ GOOD
  render: h => <p>{this.$t('hello')}</p>
  // ...
}
```

</eslint-code-block>

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-raw-text": [
    "error",
    {
      "attributes": {
        "/.+/": [
          "title",
          "aria-label",
          "aria-placeholder",
          "aria-roledescription",
          "aria-valuetext"
        ],
        "input": ["placeholder"],
        "img": ["alt"]
      },
      "ignoreNodes": ["md-icon", "v-icon"],
      "ignorePattern": "^[-#:()&]+$",
      "ignoreText": ["EUR", "HKD", "USD"]
    }
  ]
}
```

- `attributes`: An object whose keys are tag name or patterns and value is an array of attributes to check for that tag name. Default empty.
- `ignoreNodes`: specify nodes to ignore such as icon components. Default empty.
- `ignorePattern`: specify a regexp pattern that matches strings to ignore. Default none.
- `ignoreText`: specify an array of strings to ignore. Default empty.

### `attributes`

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-raw-text: ['error', {attributes: { '/.+/': ['label'] }}] */
</script>
<template>
  <!-- ✗ BAD -->
  <my-input label="hello" />
  <any-component label="hello" />
</template>
```

</eslint-code-block>

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/no-raw-text: ['error', {attributes: { 'MyInput': ['label'] }}] */
</script>
<template>
  <!-- ✗ BAD -->
  <my-input label="hello" />
  <!-- ✓ GOOD -->
  <other-component label="hello" />
</template>
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@intlify/eslint-plugin-vue-i18n` v0.2.0

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-raw-text.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/no-raw-text.ts)
