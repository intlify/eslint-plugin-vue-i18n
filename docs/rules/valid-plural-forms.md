---
title: '@intlify/vue-i18n/valid-plural-forms'
description: enforce valid plural form counts for each locale to prevent runtime errors
---

# @intlify/vue-i18n/valid-plural-forms

> enforce valid plural form counts for each locale to prevent runtime errors

## :book: Rule Details

This rule validates that plural messages have the correct number of forms for each locale.

Different languages require different numbers of plural forms. For example:

- **English** needs 2 forms (singular, plural)
- **Serbian** needs 3 forms (one, few, other)
- **Slovenian** needs 4 forms (one, two, few, other)

When a translation has an incorrect number of plural forms, vue-i18n's `pluralRules` function may return an out-of-bounds index, causing runtime errors (`UNEXPECTED_RETURN_TYPE`).

<eslint-code-block>

<!-- eslint-skip -->

```vue
<script>
/* eslint @intlify/vue-i18n/valid-plural-forms: ["error", { "pluralFormCounts": { "sl": [2, 4] } }] */
</script>

<i18n locale="sl">
{
  // ✓ GOOD - 4 forms (full Slovenian pluralization)
  "months": "{n} mesec | {n} meseca | {n} meseci | {n} mesecev",

  // ✓ GOOD - 2 forms (binary: singular/plural)
  "items": "{n} element | {n} elementov",

  // ✗ BAD - 3 forms (invalid for Slovenian)
  "years": "{n} leto | {n} leti | {n} let"
}
</i18n>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@intlify/vue-i18n/valid-plural-forms": [
    "error",
    {
      "pluralFormCounts": {
        "sl": [2, 4],
        "sr-latn": [2, 3]
      }
    }
  ]
}
```

### `pluralFormCounts`

An object mapping locale codes to arrays of valid plural form counts.

**Default behavior**: Locales not in `pluralFormCounts` default to `[2, 3]` (vue-i18n's built-in pluralization supports 2 forms for singular/plural, or 3 forms for zero/one/many).

- Each locale can have multiple valid counts (e.g., `[2, 4]` means both 2 and 4 forms are acceptable)
- Use `[2]` for languages like English that only support binary pluralization
- Use `[2, N]` where N is the full form count for languages that support both binary and full pluralization

## :earth_americas: Common Plural Form Counts by Language

Based on [CLDR Plural Rules](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html):

| Language       | Full Form Count | Recommended Config |
| -------------- | --------------- | ------------------ |
| English (en)   | 2               | `[2]`              |
| German (de)    | 2               | `[2]`              |
| French (fr)    | 3               | `[2, 3]`           |
| Serbian (sr)   | 3               | `[2, 3]`           |
| Croatian (hr)  | 3               | `[2, 3]`           |
| Slovenian (sl) | 4               | `[2, 4]`           |
| Russian (ru)   | 4               | `[2, 4]`           |
| Polish (pl)    | 4               | `[2, 4]`           |
| Arabic (ar)    | 6               | `[2, 6]`           |

## :couple: Related Rules

- [@intlify/vue-i18n/valid-message-syntax](./valid-message-syntax.md)

## :books: Further reading

- [Vue I18n Pluralization](https://vue-i18n.intlify.dev/guide/essentials/pluralization)
- [CLDR Language Plural Rules](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html)

## :mag: Implementation

- [Rule source](https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/valid-plural-forms.ts)
- [Test source](https://github.com/intlify/eslint-plugin-vue-i18n/tree/master/tests/lib/rules/valid-plural-forms.ts)
