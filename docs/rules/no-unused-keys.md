# vue-i18n/no-unused-keys

> disallow unused localization keys

Localization keys that not used anywhere in the code are most likely an error due to incomplete refactoring. Such localization keys take up code size and can lead to confusion by readers.

## :book: Rule Details

This rule is aimed at eliminating unused localization keys.

:-1: Examples of **incorrect** code for this rule:

locale messages:
```js
// ✗ BAD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!" // not used in application
}
```

In localization codes of application:

```vue
<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
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

i18n.t('hello')
```

:+1: Examples of **correct** code for this rule:

locale messages:
// ✓ GOOD
```js
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!"
}
```

In localization codes of application:

```vue
<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
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

i18n.t('hi')
```

## Options

You can specify allowed directive-comments.

```json
{
  "vue-i18n/no-unused-keys": ["error", {
    "extensions": [".js", ".vue"]
  }]
}
```

- `extenstions`: an array to allow specified lintable target file extention. If you don't set any options, it set to `.js` and` .vue` as default.
