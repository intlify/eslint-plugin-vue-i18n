# @intlify/vue-i18n/no-missing-keys-in-other-locales

> disallow missing locale message keys in other locales

This rule warns if a key with the same path as the key of resource does not exist in another locale.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

locale messages:

```json5
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

:+1: Examples of **correct** code for this rule:

locale messages:

```json5
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
