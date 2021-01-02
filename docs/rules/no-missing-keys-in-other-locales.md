# @intlify/vue-i18n/no-missing-keys-in-other-locales

> disallow missing locale message keys in other locales

This rule warns if a key with the same path as the key of resource does not exist in another locale.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

locale messages:

<resource-group>

<eslint-code-block language="json" locale-key="key">

```json5
/* eslint @intlify/vue-i18n/no-missing-keys-in-other-locales: 'error' */

{
  "en": {
    /* ✓ GOOD */
    "hello": "Hello!",
    /* ✗ BAD */
    "goodbye": "Goodbye!"
  },
  "ja": {
    "hello": "こんにちは!"
  }
}
```

</eslint-code-block>

</resource-group>

:+1: Examples of **correct** code for this rule:

locale messages:

<resource-group>

<eslint-code-block language="json" locale-key="key">

```json5
/* eslint @intlify/vue-i18n/no-missing-keys-in-other-locales: 'error' */

{
  "en": {
    /* ✓ GOOD */
    "hello": "Hello!",
    "goodbye": "Goodbye!"
  },
  "ja": {
    "hello": "こんにちは!",
    "goodbye": "さようなら!"
  }
}
```

</eslint-code-block>

</resource-group>

## Options

```json
{
  "@intlify/vue-i18n/no-missing-keys-in-other-locales": ["error",
    {
      "ignoreLocales": []
    }
  ]
}
```

- `ignoreLocales`: If you specify an array of locales, that locale is allowed even if it is missing.

## :couple: Related Rules

- [@intlify/vue-i18n/no-duplicate-keys-in-locale](./no-duplicate-keys-in-locale.md)
- [@intlify/vue-i18n/no-missing-keys](./no-missing-keys.md)
