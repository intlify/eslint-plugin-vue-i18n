# Available Rules

- :star: mark: the rule which is enabled by `plugin:@intlify/vue-i18n/recommended` or `*.configs["flat/recommended"]` preset.
- :black_nib: mark: the rule which is fixable by `eslint --fix` command.

## Recommended

<!--prettier-ignore-->
| Rule ID | Description |    |
|:--------|:------------|:---|
| [@intlify/vue-i18n/<wbr>no-deprecated-i18n-component](./no-deprecated-i18n-component.html) | disallow using deprecated `<i18n>` components (in Vue I18n 9.0.0+) | :star::black_nib: |
| [@intlify/vue-i18n/<wbr>no-deprecated-i18n-place-attr](./no-deprecated-i18n-place-attr.html) | disallow using deprecated `place` attribute (Removed in Vue I18n 9.0.0+) | :star: |
| [@intlify/vue-i18n/<wbr>no-deprecated-i18n-places-prop](./no-deprecated-i18n-places-prop.html) | disallow using deprecated `places` prop (Removed in Vue I18n 9.0.0+) | :star: |
| [@intlify/vue-i18n/<wbr>no-deprecated-modulo-syntax](./no-deprecated-modulo-syntax.html) | enforce modulo interpolation to be named interpolation | :star::black_nib: |
| [@intlify/vue-i18n/<wbr>no-deprecated-tc](./no-deprecated-tc.html) | disallow using deprecated `tc` or `$tc` (Deprecated in Vue I18n 10.0.0, removed fully in Vue I18n 11.0.0) | :star: |
| [@intlify/vue-i18n/<wbr>no-html-messages](./no-html-messages.html) | disallow use HTML localization messages | :star: |
| [@intlify/vue-i18n/<wbr>no-i18n-t-path-prop](./no-i18n-t-path-prop.html) | disallow using `path` prop with `<i18n-t>` | :star::black_nib: |
| [@intlify/vue-i18n/<wbr>no-missing-keys](./no-missing-keys.html) | disallow missing locale message key at localization methods | :star: |
| [@intlify/vue-i18n/<wbr>no-raw-text](./no-raw-text.html) | disallow to string literal in template or JSX | :star: |
| [@intlify/vue-i18n/<wbr>no-v-html](./no-v-html.html) | disallow use of localization methods on v-html to prevent XSS attack | :star: |
| [@intlify/vue-i18n/<wbr>valid-message-syntax](./valid-message-syntax.html) | disallow invalid message syntax | :star: |

## Best Practices

<!--prettier-ignore-->
| Rule ID | Description |    |
|:--------|:------------|:---|
| [@intlify/vue-i18n/<wbr>key-format-style](./key-format-style.html) | enforce specific casing for localization keys |  |
| [@intlify/vue-i18n/<wbr>no-duplicate-keys-in-locale](./no-duplicate-keys-in-locale.html) | disallow duplicate localization keys within the same locale |  |
| [@intlify/vue-i18n/<wbr>no-dynamic-keys](./no-dynamic-keys.html) | disallow localization dynamic keys at localization methods |  |
| [@intlify/vue-i18n/<wbr>no-missing-keys-in-other-locales](./no-missing-keys-in-other-locales.html) | disallow missing locale message keys in other locales |  |
| [@intlify/vue-i18n/<wbr>no-unknown-locale](./no-unknown-locale.html) | disallow unknown locale name |  |
| [@intlify/vue-i18n/<wbr>no-unused-keys](./no-unused-keys.html) | disallow unused localization keys | :black_nib: |
| [@intlify/vue-i18n/<wbr>prefer-sfc-lang-attr](./prefer-sfc-lang-attr.html) | require lang attribute on `<i18n>` block | :black_nib: |

## Stylistic Issues

<!--prettier-ignore-->
| Rule ID | Description |    |
|:--------|:------------|:---|
| [@intlify/vue-i18n/<wbr>prefer-linked-key-with-paren](./prefer-linked-key-with-paren.html) | enforce linked key to be enclosed in parentheses | :black_nib: |
| [@intlify/vue-i18n/<wbr>sfc-locale-attr](./sfc-locale-attr.html) | require or disallow the locale attribute on `<i18n>` block |  |
