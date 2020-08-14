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

```yaml
# ✗ BAD: Use array elements.
- message1
- message2
- message3
...
# ✗ BAD: Use object for key.
{foo: bar}: message
[1,2,3]: message
```

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

```yaml
# ✓ GOOD
appTitle: I18N Management System
```

:-1: Examples of **incorrect** code for this rule with `"camelCase"`:

```yaml
# ✗ BAD
app-title: I18N Management System
app_title: I18N Management System
```

:+1: Examples of **correct** code for this rule with `"kebab-case"`:

```yaml
# ✓ GOOD
app-title: I18N Management System
```

:-1: Examples of **incorrect** code for this rule with `"kebab-case"`:

```yaml
# ✗ BAD
appTitle: I18N Management System
app_title: I18N Management System
```

:+1: Examples of **correct** code for this rule with `"snake_case"`:

```yaml
# ✓ GOOD
app_title: I18N Management System
```

:-1: Examples of **incorrect** code for this rule with `"snake_case"`:

```yaml
# ✗ BAD
appTitle: I18N Management System
app-title: I18N Management System
```

:+1: Examples of **correct** code for this rule with `{"allowArray": true}`:

```yaml
# ✓ GOOD
- message1
- message2
- message3
```
