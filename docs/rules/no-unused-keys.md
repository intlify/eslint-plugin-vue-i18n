# @intlify/vue-i18n/no-unused-keys

> disallow unused localization keys

Localization keys that not used anywhere in the code are most likely an error due to incomplete refactoring. Such localization keys take up code size and can lead to confusion by readers.

## :book: Rule Details

This rule is aimed at eliminating unused localization keys.

:-1: Examples of **incorrect** code for this rule:

locale messages:
```json
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
import VueI18n from 'vue-i18n'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

i18n.t('hello')
```

For SFC.

```vue
<i18n>
{
  "en": {
    "hello": "Hello! DIO!",
    "hi": "Hi! DIO!" // not used in SFC
  }
}
</i18n>

<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
  </div>
</template>
```

:+1: Examples of **correct** code for this rule:

locale messages:
```json
// ✓ GOOD
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
import VueI18n from 'vue-i18n'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

i18n.t('hi')
```

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-unused-keys": ["error", {
    "src": ["./src"],
    "extensions": [".js", ".vue"]
  }]
}
```

- `src`: specify the source codes directory to be able to lint. If you don't set any options, it set to `process.cwd()` as default.
- `extensions`: an array to allow specified lintable target file extension. If you don't set any options, it set to `.js` and` .vue` as default.
