# vue-i18n/no-missing-key

> disallow missing locale message key at localization methods

- :star: The `"extends": "plugin:vue-i18n/recommended"` property in a configuration file enables this rule.

This rule warns locale message key missing if the key does not exist in locale messages.

## :book: Rule Details

The methods that can be detected with this rule are as follows:

- `$t`
- `t`
- `$tc`
- `tc`

:-1: Examples of **incorrect** code for this rule:

```js
const localeMessages = {
  en: {
    hello: 'Hello! DIO!'
  }
  ja: {
    hello: 'こんにちは、DIO！'
  }
}

const i18n = new VueI18n({
  locale: 'en',
  localeMessages
})

/* ✗ BAD */
i18n.t('hi')
```

:+1: Examples of **correct** code for this rule:

```js
const localeMessages = {
  en: {
    hello: 'Hello! DIO!'
  }
  ja: {
    hello: 'こんにちは、DIO！'
  }
}

const i18n = new VueI18n({
  locale: 'en',
  localeMessages
})

/* ✓ GOOD */
i18n.t('hello')
```
