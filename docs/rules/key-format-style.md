---
title: "@intlify/vue-i18n/key-format-style"
description: enforce specific casing for localization keys
---
# @intlify/vue-i18n/key-format-style

> enforce specific casing for localization keys

This rule aims to enforces specific casing for localization key names.

```yaml
camelCaseKey: The key for this value is camel case.
kebab-case-key: The key for this value is kebab case.
snake_case_key: The key for this value is snake case.
mixed_Case-key: Perhaps you don't want to use this casing.
```

## :book: Rule Details

This rule reports localization keys other than the specific casing.
Also, the following localization key definitions are reported as errors, because the casing cannot determine.

:-1: Examples of **incorrect** code for this rule:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: 'error'

# ✗ BAD: Use array elements.
- message1
- message2
- message3
...
# ✗ BAD: Use object for key.
{foo: bar}: message
[1,2,3]: message
```

</eslint-code-block>

## Options

```json
{
  "@intlify/vue-i18n/key-format-style": ["error",
    "camelCase" | "kebab-case" | "snake_case",
    {
      "allowArray": false
    }
  ]
}
```

- Primary Option: Select the casing you want to apply. It set to `"camelCase"` as default
- `allowArray`: If `true`, allow the use of arrays. If `false`, disallow the use of arrays. It set to `false` as default.

:+1: Examples of **correct** code for this rule with `"camelCase"`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'camelCase']

# ✓ GOOD
appTitle: I18N Management System
```

</eslint-code-block>

:-1: Examples of **incorrect** code for this rule with `"camelCase"`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'camelCase']

# ✗ BAD
app-title: I18N Management System
app_title: I18N Management System
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule with `"kebab-case"`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'kebab-case']

# ✓ GOOD
app-title: I18N Management System
```

</eslint-code-block>

:-1: Examples of **incorrect** code for this rule with `"kebab-case"`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'kebab-case']

# ✗ BAD
appTitle: I18N Management System
app_title: I18N Management System
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule with `"snake_case"`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'snake_case']

# ✓ GOOD
app_title: I18N Management System
```

</eslint-code-block>

:-1: Examples of **incorrect** code for this rule with `"snake_case"`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'snake_case']

# ✗ BAD
appTitle: I18N Management System
app-title: I18N Management System
```

</eslint-code-block>

:+1: Examples of **correct** code for this rule with `{"allowArray": true}`:

<eslint-code-block language="yaml">

```yaml
# eslint @intlify/vue-i18n/key-format-style: ['error', 'camelCase', {allowArray: true}]

# ✓ GOOD
- message1
- message2
- message3
```

</eslint-code-block>

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/key-format-style.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/key-format-style.ts)
