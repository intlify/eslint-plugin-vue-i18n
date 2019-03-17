# vue-i18n/no-dynamic-keys

> disallow localization dynamic keys at localization methods

This rule warns localization dynamic keys.

This role is useful for unifying all static keys in your application.

## :book: Rule Details

You can be detected with this rule the following:

- `$t`
- `t`
- `$tc`
- `tc`
- `v-t`

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
    <p>{{ $t(msg) }}</p>
    <!-- ✗ BAD -->
    <p v-t="msg"></p>
  </div>
</template>
```

```js
const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

const app = new Vue({
  i18n,
  data () {
    return { msg: 'hello' }
  }
})

/* ✗ BAD */
i18n.t(app.msg)
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
    <!-- ✗ GOOD -->
    <p>{{ $t('hello') }}</p>
    <!-- ✗ GOOD -->
    <p v-t="'hello'"></p>
  </div>
</template>
```

```js
const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

const app = new Vue({
  i18n,
  data () {
    return { msg: 'hello' }
  }
})

/* ✓ GOOD */
i18n.t('hello')
```
