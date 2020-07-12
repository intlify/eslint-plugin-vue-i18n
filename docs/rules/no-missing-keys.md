# @intlify/vue-i18n/no-missing-keys

> disallow missing locale message key at localization methods

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` property in a configuration file enables this rule.

This rule warns locale message key missing if the key does not exist in locale messages.

## :book: Rule Details

You can be detected with this rule the following:

- `$t`
- `t`
- `$tc`
- `tc`
- `v-t`
- `<i18n>` 

:-1: Examples of **incorrect** code for this rule:

locale messages:
```json
{
  "hello": "Hello! DIO!"
}
```

localization codes:

```vue
<template>
  <div class="app">
    <!-- ✗ BAD -->
    <p>{{ $t('hi') }}</p>
    <!-- ✗ BAD -->
    <p v-t="'hi'"></p>
    <!-- ✗ BAD -->
    <i18n path="hi" tag="p"></i18n>
  </div>
</template>
```

```js
import VueI18n from 'vue-i18n'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

/* ✗ BAD */
i18n.t('hi')
```

:+1: Examples of **correct** code for this rule:

locale messages:
```json
{
  "hello": "Hello! DIO!"
}
```

localization codes:

```vue
<template>
  <div class="app">
    <!-- ✓ GOOD -->
    <p>{{ $t('hello') }}</p>
    <!-- ✓ GOOD -->
    <p v-t="'hello'"></p>
    <!-- ✓ GOOD -->
    <i18n path="hello" tag="p"></i18n>
  </div>
</template>
```

```js
import VueI18n from 'vue-i18n'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

/* ✓ GOOD */
i18n.t('hello')
```
