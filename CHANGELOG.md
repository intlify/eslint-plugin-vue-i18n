Version 9 of Highlight.js has reached EOL and is no longer supported.
Please upgrade or ask whatever dependency you are using to upgrade.
https://github.com/highlightjs/highlight.js/issues/2877

## v0.11.0 (2021-02-23)

#### :star: Features
* [#166](https://github.com/intlify/eslint-plugin-vue-i18n/pull/166) Add no-deprecated-i18n-places-prop rule ([@ota-meshi](https://github.com/ota-meshi))
* [#167](https://github.com/intlify/eslint-plugin-vue-i18n/pull/167) Add no-i18n-t-path-prop rule ([@ota-meshi](https://github.com/ota-meshi))
* [#165](https://github.com/intlify/eslint-plugin-vue-i18n/pull/165) Add no-deprecated-i18n-place-attr rule ([@ota-meshi](https://github.com/ota-meshi))
* [#164](https://github.com/intlify/eslint-plugin-vue-i18n/pull/164) Add no-deprecated-i18n-component rule ([@ota-meshi](https://github.com/ota-meshi))

#### Committers: 1
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))

## v0.10.0 (2021-01-04)

#### :star: Features
* [#149](https://github.com/intlify/eslint-plugin-vue-i18n/pull/149) Add `prefer-linked-key-with-paren` rule ([@ota-meshi](https://github.com/ota-meshi))
* [#148](https://github.com/intlify/eslint-plugin-vue-i18n/pull/148) Add `no-missing-keys-in-other-locales` rule  ([@ota-meshi](https://github.com/ota-meshi))
* [#148](https://github.com/intlify/eslint-plugin-vue-i18n/pull/148) Change `no-missing-keys` rule to not report if there is one matching key ([@ota-meshi](https://github.com/ota-meshi))
* [#147](https://github.com/intlify/eslint-plugin-vue-i18n/pull/147) Add `valid-message-syntax` rule ([@ota-meshi](https://github.com/ota-meshi))
* [#145](https://github.com/intlify/eslint-plugin-vue-i18n/pull/145) Supports vue-i18n v9 message format ([@ota-meshi](https://github.com/ota-meshi))

#### :bug: Bug Fixes
* [#150](https://github.com/intlify/eslint-plugin-vue-i18n/pull/150) Fix false negatives for member expression in `no-dynamic-keys` rule ([@ota-meshi](https://github.com/ota-meshi))

#### :pencil: Documentation
* [#153](https://github.com/intlify/eslint-plugin-vue-i18n/pull/153) Replace documentation example with `vue-eslint-editor` ([@ota-meshi](https://github.com/ota-meshi))
* [#144](https://github.com/intlify/eslint-plugin-vue-i18n/pull/144) Chores: Add to documentation that eslint-plugin-jsonc and eslint-plugin-yml can be used ([@ota-meshi](https://github.com/ota-meshi))
* [#122](https://github.com/intlify/eslint-plugin-vue-i18n/pull/122) Docs: Fix typo and dead link ([@mfmfuyu](https://github.com/mfmfuyu))

#### Committers: 2
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))
- fuyu ([@mfmfuyu](https://github.com/mfmfuyu))


## v0.9.0 (2020-08-17)

#### :star: Features
* [#114](https://github.com/intlify/eslint-plugin-vue-i18n/pull/114) Add support for multiple locale directories ([@ota-meshi](https://github.com/ota-meshi))
* [#116](https://github.com/intlify/eslint-plugin-vue-i18n/pull/116) Add `@intlify/vue-i18n/key-format-style` rule ([@ota-meshi](https://github.com/ota-meshi))
* [#112](https://github.com/intlify/eslint-plugin-vue-i18n/pull/112) Add `@intlify/vue-i18n/no-duplicate-keys-in-locale` rule and change `@intlify/vue-i18n/no-missing-keys` rule to not report if there is one matching key in each locale ([@ota-meshi](https://github.com/ota-meshi))

#### :bug: Bug Fixes
* [#115](https://github.com/intlify/eslint-plugin-vue-i18n/pull/115) Fix false positives when key contains object in YAML in `no-unused-keys` rule. ([@ota-meshi](https://github.com/ota-meshi))
* [#111](https://github.com/intlify/eslint-plugin-vue-i18n/pull/111) Fix false negatives in `<i18n>` block without `<template>` in `no-unused-keys` rule. ([@ota-meshi](https://github.com/ota-meshi))

#### :pencil: Documentation
* [#110](https://github.com/intlify/eslint-plugin-vue-i18n/pull/110) Add TypeScript FAQ. ([@ota-meshi](https://github.com/ota-meshi))

#### Committers: 1
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))


## v0.8.1 (2020-08-07)

#### :bug: Bug Fixes
* [#99](https://github.com/intlify/eslint-plugin-vue-i18n/pull/99) Fix release does not include build files. ([@ota-meshi](https://github.com/ota-meshi))

#### Committers: 1
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))


## v0.8.0 (2020-08-07)

#### :star: Features
* [#94](https://github.com/intlify/eslint-plugin-vue-i18n/pull/94) Add support YAML and JSON5 resources. ([@ota-meshi](https://github.com/ota-meshi))

#### :bug: Bug Fixes
* [#92](https://github.com/intlify/eslint-plugin-vue-i18n/pull/92) Fix false positives of key used in `<i18n>` component in `no-unused-keys` rule. ([@ota-meshi](https://github.com/ota-meshi))

#### :zap: Improvement Features
* [#93](https://github.com/intlify/eslint-plugin-vue-i18n/pull/93) Change `no-missing-keys` and `no-dynamic-keys` rules to also verify keys used in the `<i18n-t>` component. ([@ota-meshi](https://github.com/ota-meshi))
* [#87](https://github.com/intlify/eslint-plugin-vue-i18n/pull/87) Change to apply update when resource file is updated. ([@ota-meshi](https://github.com/ota-meshi))

#### :pencil: Documentation
* [#89](https://github.com/intlify/eslint-plugin-vue-i18n/pull/89) docs: fix $t in example ([@azu](https://github.com/azu))

#### Committers: 2
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))
- azu ([@azu](https://github.com/azu))


## v0.7.0 (2020-07-27)

#### :star: Features
* [#83](https://github.com/intlify/eslint-plugin-vue-i18n/pull/83) Add `enableFix` option to `@intlify/vue-i18n/no-unused-keys` rule ([@ota-meshi](https://github.com/ota-meshi))
* [#80](https://github.com/intlify/eslint-plugin-vue-i18n/pull/80) Add support for `<i18n>` blocks of SFC. ([@ota-meshi](https://github.com/ota-meshi))

#### Committers: 1
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))


## v0.6.0 (2020-07-19)

#### :bug: Bug Fixes
* [#76](https://github.com/intlify/eslint-plugin-vue-i18n/pull/76) Fix false positives for linked keys in no-unused-keys rule ([@ota-meshi](https://github.com/ota-meshi))

#### :zap: Improvement Features
* [#75](https://github.com/intlify/eslint-plugin-vue-i18n/pull/75) Change "settings['vue-i18n'].localeDir" to can specify object options. ([@ota-meshi](https://github.com/ota-meshi))

#### Committers: 1
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))


## v0.5.0 (2020-07-12)

#### :bug: Bug Fixes
* [#71](https://github.com/intlify/eslint-plugin-vue-i18n/pull/71) Fixed missing namespace in recommended config. ([@ota-meshi](https://github.com/ota-meshi))

#### Committers: 1
- Yosuke Ota ([@ota-meshi](https://github.com/ota-meshi))


## v0.4.1 (2020-04-19)

#### :pencil: Documentation
* [#52](https://github.com/intlify/eslint-plugin-vue-i18n/pull/52) Add missing close quote to no-missing-keys.md. ([@jlebar](https://github.com/jlebar))

#### Committers: 1
- Justin Lebar ([@jlebar](https://github.com/jlebar))


## v0.4.0 (2020-01-22)

#### :boom: Breaking Change
* [#39](https://github.com/intlify/eslint-plugin-vue-i18n/pull/39) breaking: re-setup due to repository transfer ([@kazupon](https://github.com/kazupon))

#### Committers: 2
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- kazuya kawaguchi ([@kazupon](https://github.com/kazupon))

<a name="0.3.0"></a>
# [0.3.0](https://github.com/kazupon/eslint-plugin-vue-i18n/compare/v0.2.3...v0.3.0) (2019-10-02)


### :star: New Features

* **rule:** No raw text ignore options ([#31](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/31)) by [@stevelacey](https://github.com/stevelacey) ([34b7a25](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/34b7a25)), closes [#31](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/31)



<a name="0.2.3"></a>
## [0.2.3](https://github.com/kazupon/eslint-plugin-vue-i18n/compare/v0.2.2...v0.2.3) (2019-07-22)


### :bug: Bug Fixes

* **rule:** fix detect literal ([6b6efae](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/6b6efae)), closes [#24](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/24)



<a name="0.2.2"></a>
## [0.2.2](https://github.com/kazupon/eslint-plugin-vue-i18n/compare/v0.2.1...v0.2.2) (2019-07-22)


### :bug: Bug Fixes

* **rule:** fix cannot detect raw text of template syntax expression ([84f37b8](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/84f37b8)), closes [#23](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/23)



<a name="0.2.1"></a>
## [0.2.1](https://github.com/kazupon/eslint-plugin-vue-i18n/compare/v0.2.0...v0.2.1) (2019-07-16)


### :bug: Bug Fixes

* **rule:** fix no-raw-text bug ([bc6a830](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/bc6a830))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/kazupon/eslint-plugin-vue-i18n/compare/v0.1.1...v0.2.0) (2019-07-12)


### :star: New Features

* **rule:** support no-raw-text rule ([76077b4](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/76077b4)), closes [#2](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/2)


### :zap: Improvements

* support ESLint v6 ([69e16a6](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/69e16a6)), closes [#12](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/12)



<a name="0.1.1"></a>
## [0.1.1](https://github.com/kazupon/eslint-plugin-vue-i18n/compare/v0.1.0...v0.1.1) (2019-05-08)


### :bug: Bug Fixes

* **no-missing-keys:** fix plugin crashes on missing nested path ([#7](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/7)) by [@williamchong007](https://github.com/williamchong007) ([ed02d94](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/ed02d94)), closes [#7](https://github.com/kazupon/eslint-plugin-vue-i18n/issues/7)



<a name="0.1.0"></a>
# 0.1.0 (2019-04-10)


### :star: New Features

* **rule:** add no-dynamic-keys rule ([7612dfd](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/7612dfd))
* **rule:** add no-html-messages rule ([e75546f](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/e75546f))
* **rule:** add no-missing-key rule ([d35001d](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/d35001d))
* **rule:** add no-unused-key rule ([09ee649](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/09ee649))
* **rule:** add no-v-html rule ([f9636da](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/f9636da))


### :up: Updates

* add docs deploy script ([39b503f](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/39b503f))
* tweak line error messages ([eb9b528](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/eb9b528))
* **config:** recommended config file ([2e5c3c5](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/2e5c3c5))
* **no-dynamic-keys:** support i18n functional component ([1fc1589](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/1fc1589))
* **no-missing-keys:** support i18n functional component ([d6f08ea](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/d6f08ea))
* add generation scripts ([2b0ff7d](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/2b0ff7d))
* change recommended rule level ([9d310aa](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/9d310aa))
* change rule category ([17a1aed](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/17a1aed))
* generation scripts ([3dee7c4](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/3dee7c4))
* rule name ([e5cb3d0](https://github.com/kazupon/eslint-plugin-vue-i18n/commit/e5cb3d0))



