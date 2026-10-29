---
'@intlify/eslint-plugin-vue-i18n': minor
---

Add `keyPrefix` option to `settings['vue-i18n'].localeDir` object configuration.

This allows the localization messages of a single locale to be split across multiple files that are merged under different keys. When `keyPrefix` is specified, the contents of the matched files are treated as if they were nested under that key path (e.g. with `keyPrefix: 'errors'`, a `required` key in the file is referenced as `errors.required` in your source code). See [#401](https://github.com/intlify/eslint-plugin-vue-i18n/issues/401).
