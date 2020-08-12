# @intlify/vue-i18n/no-duplicate-keys-in-locale

> disallow duplicate localization keys within the same locale

If you manage localization messages in multiple files, duplicate localization keys across multiple files can cause unexpected problems.

## :book: Rule Details

This rule reports duplicate localization keys within the same locale.

:-1: Examples of **incorrect** code for this rule:

locale messages:

- `en.1.json`

```json5
// ✗ BAD
{
  "hello": "Hello! DIO!", // duplicate.
  "hello": "Hello! DIO!", // duplicate.
  "good-bye": "Good bye! DIO!"
}
```

- `en.2.json`

```json5
// ✗ BAD
{
  "good-bye": "Good bye! DIO!" // This same key exists in `en.1.json`.
}
```

:+1: Examples of **correct** code for this rule:

locale messages:

- `en.1.json`

```json5
// ✓ GOOD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!"
}
```

- `en.2.json`

```json5
// ✓ GOOD
{
  "good-bye": "Good bye! DIO!" // This same key exists in `en.1.json`.
}
```

## :gear: Options

```json
{
  "@intlify/vue-i18n/no-duplicate-keys-in-locale": ["error", {
    "ignoreI18nBlock": false
  }]
}
```

- `ignoreI18nBlock`: If `true`, do not report key duplication between `<i18n>` blocks and other files, it set to `false` as default.
