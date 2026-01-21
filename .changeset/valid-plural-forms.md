---
"@intlify/eslint-plugin-vue-i18n": minor
---

Add `valid-plural-forms` rule to validate plural form counts per locale

This rule enforces that plural messages have the correct number of forms for each locale, helping prevent runtime errors when vue-i18n's `pluralRules` function returns an out-of-bounds index.

- Defaults to `[2, 3]` for all locales (matches vue-i18n's built-in pluralization)
- Use `pluralFormCounts` to configure locale-specific overrides
- Arrays allow multiple valid counts (e.g., `[2, 4]` for languages supporting both binary and full pluralization)

Configuration example:
```json
{
  "@intlify/vue-i18n/valid-plural-forms": ["error", {
    "pluralFormCounts": {
      "sl": [2, 4],
      "sr-latn": [2, 3]
    }
  }]
}
```
