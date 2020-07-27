# Available Rules

- :star: mark: the rule which is enabled by `plugin:@intlify/vue-i18n/recommended` preset.
- :black_nib: mark: the rule which is fixable by `eslint --fix` command.

## Recommended

| Rule ID | Description |    |
|:--------|:------------|:---|
| [@intlify/vue-i18n/<wbr>no-html-messages](./no-html-messages.html) | disallow use HTML localization messages | :star: |
| [@intlify/vue-i18n/<wbr>no-missing-keys](./no-missing-keys.html) | disallow missing locale message key at localization methods | :star: |
| [@intlify/vue-i18n/<wbr>no-raw-text](./no-raw-text.html) | disallow to string literal in template or JSX | :star: |
| [@intlify/vue-i18n/<wbr>no-v-html](./no-v-html.html) | disallow use of localization methods on v-html to prevent XSS attack | :star: |

## Best Practices

| Rule ID | Description |    |
|:--------|:------------|:---|
| [@intlify/vue-i18n/<wbr>no-dynamic-keys](./no-dynamic-keys.html) | disallow localization dynamic keys at localization methods |  |
| [@intlify/vue-i18n/<wbr>no-unused-keys](./no-unused-keys.html) | disallow unused localization keys | :black_nib: |

