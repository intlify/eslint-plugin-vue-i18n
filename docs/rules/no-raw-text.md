# vue-i18n/no-raw-text

> disallow to string literal in template or JSX

- :star: The `"extends": "plugin:vue-i18n/recommended"` property in a configuration file enables this rule.

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
  template: `<p>{{ $('hello') }}</p>`
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
