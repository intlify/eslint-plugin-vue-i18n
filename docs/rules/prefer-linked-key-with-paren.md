# @intlify/vue-i18n/prefer-linked-key-with-paren

> enforce linked key to be enclosed in parentheses

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

This rule enforces the linked message key to be enclosed in parentheses.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

locale messages:

```json
{
  "hello": "Hello @:world.",
  "world": "world"
}
```

:+1: Examples of **correct** code for this rule:

locale messages (for vue-i18n v9+):

```json
{
  "hello": "Hello @:{'world'}.",
  "world": "world"
}
```

locale messages (for vue-i18n v8):

```json
{
  "hello": "Hello @:(world).",
  "world": "world"
}
```
