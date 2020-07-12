# @intlify/vue-i18n/valid-message-syntax

> disallow invalid message syntax

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` property in a configuration file enables this rule.

This rule warns invalid message syntax.

This rule is useful localization leaks with incorrect message syntax.

## :book: Rule Details

:-1: Examples of **incorrect** code for this rule:

```json
// ✗ BAD
{
  "list-hello": "Hello! {{0}}",
  "named-hello": "Hello! {{name}}",
  "linked-hello": "ref:list-hello"
}
```


:+1: Examples of **correct** code for this rule:

```json
// ✓ GOOD
{
  "list-hello": "Hello! {0}",
  "named-hello": "Hello! {name}",
  "linked-hello": "@:list-hello"
}
```
