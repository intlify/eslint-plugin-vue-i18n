# @intlify/vue-i18n/keys-order

> enforce order of localization keys

- :black_nib: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

This rule aims to enforce ordering of localization keys.

This rule is useful to provide browsability of localization keys.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block fix language="json">

```json
/* eslint @intlify/vue-i18n/keys-order: 'error' */

// ✗ BAD
{
  "message3": "hi!",
  "message2": "hey!",
  "message1": "hello!"
}
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule:

<eslint-code-block fix language="json">

```json
/* eslint @intlify/vue-i18n/keys-order: 'error' */

// ✓ GOOD
{
  "message1": "hello!",
  "message2": "hey!",
  "message3": "hi!"
}
```

</eslint-code-block>

## :gear: Options

```json
{
  "@intlify/vue-i18n/keys-order": [
    "error",
    {
      "order": "desc"
    }
  ]
}
```

- `order`: Case-sensitive sort order of localization keys. Possible values: `asc|desc`. If you don't set any options, it set to `asc` as default.
