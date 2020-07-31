# @intlify/vue-i18n/no-raw-text

> disallow to string literal in template or JSX

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` property in a configuration file enables this rule.

This rule warns the usage of string literal.

This rule encourage i18n in about the application needs to be localized.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

`template` option:
```js
export default {
  // ✗ BAD
  template: '<p>hello</p>'
  // ...
}
```

`template` block of single-file components:
```vue
<template>
  <!-- ✗ BAD -->
  <p>hello</p>
</template>
```

`JSX`:
```js
export default {
  // ✗ BAD
  render: h => (<p>hello</p>)
  // ...
}
```

:+1: Examples of **correct** code for this rule:

`template` option:
```js
export default {
  // ✓ GOOD
  template: `<p>{{ $t('hello') }}</p>`
  // ...
}
```

`template` block of single-file components:
```vue
<template>
  <!-- ✓ GOOD -->
  <p>{{ $t('hello') }}</p>
</template>
```

`JSX`:
```js
export default {
  // ✓ GOOD
  render: h => (<p>{this.$t('hello')}</p>)
  // ...
}
```

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-raw-text": ["error", {
    "ignoreNodes": ["md-icon", "v-icon"],
    "ignorePattern": "^[-#:()&]+$",
    "ignoreText": ["EUR", "HKD", "USD"]
  }]
}
```

- `ignoreNodes`: specify nodes to ignore such as icon components
- `ignorePattern`: specify a regexp pattern that matches strings to ignore
- `ignoreText`: specify an array of strings to ignore
