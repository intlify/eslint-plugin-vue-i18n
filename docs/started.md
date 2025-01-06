# Getting Started

## 💿 Installation

Use [npm](https://www.npmjs.com/) or a compatible tool.

```sh
npm install --save-dev eslint @intlify/eslint-plugin-vue-i18n
```

::: tip Requirements

- ESLint v8.0.0 or later
- Node.js v18.x or later

:::

## 🚀 Usage

### Configuration `eslint.config.[c|m]js`

Use `eslint.config.[c|m]js` file to configure rules. This is the default in ESLint v9, but can be used starting from ESLint v8.57.0. See also: https://eslint.org/docs/latest/use/configure/configuration-files-new.

Example eslint.config.js:

```js
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

export default [
  // add more generic rulesets here, such as:
  // js.configs.recommended, // '@eslint/js'
  // ...vue.configs['flat/recommended'], // 'eslint-plugin-vue'

  ...vueI18n.configs.recommended,
  {
    rules: {
      // Optional.
      '@intlify/vue-i18n/no-dynamic-keys': 'error',
      '@intlify/vue-i18n/no-unused-keys': [
        'error',
        {
          extensions: ['.js', '.vue']
        }
      ]
    },
    settings: {
      'vue-i18n': {
        localeDir: './path/to/locales/*.{json,json5,yaml,yml}', // extension is glob formatting!
        // or
        // localeDir: {
        //   pattern: './path/to/locales/*.{json,json5,yaml,yml}', // extension is glob formatting!
        //   localeKey: 'file' // or 'path' or 'key'
        // }
        // or
        // localeDir: [
        //   {
        //     // 'file' case
        //     pattern: './path/to/locales1/*.{json,json5,yaml,yml}',
        //     localeKey: 'file'
        //   },
        //   {
        //     // 'path' case
        //     pattern: './path/to/locales2/*.{json,json5,yaml,yml}',
        //     localePattern: /^.*\/(?<locale>[A-Za-z0-9-_]+)\/.*\.(json5?|ya?ml)$/,
        //     localeKey: 'path'
        //   },
        //   {
        //     // 'key' case
        //     pattern: './path/to/locales3/*.{json,json5,yaml,yml}',
        //     localeKey: 'key'
        //   },
        // ]

        // Specify the version of `vue-i18n` you are using.
        // If not specified, the message will be parsed twice.
        messageSyntaxVersion: '^9.0.0'
      }
    }
  }
]
```

See the [rule list](./rules/index.md) to get the `configs` & `rules` that this plugin provides.

#### Bundle Configurations `eslint.config.[c|m]js`

This plugin provides some predefined configs. You can use the following configs by adding them to `eslint.config.[c|m]js`. (All flat configs in this plugin are provided as arrays, so spread syntax is required when combining them with other configs.)

- `*.configs.base`: Settings and rules to enable correct ESLint parsing.
- `*.configs.recommended`: Above, plus rules to enforce subjective community defaults to ensure consistency.

### Configuration `.eslintrc.*`

Use `.eslintrc.*` file to configure rules in ESLint < v9. See also: https://eslint.org/docs/latest/use/configure/.

Example `.eslintrc.js`:

For example:

```js
module.exports = {
  extends: [
    'eslint:recommended',
    // Recommended
    'plugin:@intlify/vue-i18n/recommended-legacy'
  ],
  rules: {
    // Optional.
    '@intlify/vue-i18n/no-dynamic-keys': 'error',
    '@intlify/vue-i18n/no-unused-keys': [
      'error',
      {
        extensions: ['.js', '.vue']
      }
    ]
  },
  settings: {
    'vue-i18n': {
      localeDir: './path/to/locales/*.{json,json5,yaml,yml}', // extension is glob formatting!
      // or
      // localeDir: {
      //   pattern: './path/to/locales/*.{json,json5,yaml,yml}', // extension is glob formatting!
      //   localeKey: 'file' // or 'path' or 'key'
      // }
      // or
      // localeDir: [
      //   {
      //     // 'file' case
      //     pattern: './path/to/locales1/*.{json,json5,yaml,yml}',
      //     localeKey: 'file'
      //   },
      //   {
      //     // 'path' case
      //     pattern: './path/to/locales2/*.{json,json5,yaml,yml}',
      //     localePattern: /^.*\/(?<locale>[A-Za-z0-9-_]+)\/.*\.(json5?|ya?ml)$/,
      //     localeKey: 'path'
      //   },
      //   {
      //     // 'key' case
      //     pattern: './path/to/locales3/*.{json,json5,yaml,yml}',
      //     localeKey: 'key'
      //   },
      // ]

      // Specify the version of `vue-i18n` you are using.
      // If not specified, the message will be parsed twice.
      messageSyntaxVersion: '^9.0.0'
    }
  }
}
```

See the [rule list](./rules/index.md) to get the `configs` & `rules` that this plugin provides.

#### Bundle Configurations `.eslintrc.*`

This plugin provides some predefined configs. You can use the following configs by adding them to `.eslintrc.*`.

- `"plugin:@intlify/vue-i18n/base-legacy"`: Settings and rules to enable correct ESLint parsing.
- `"plugin:@intlify/vue-i18n/recommended-legacy"`: Above, plus rules to enforce subjective community defaults to ensure consistency.

### `settings['vue-i18n']`

- `localeDir` ... You can specify a string or an object or an array.
  - String option ... A glob for specifying files that store localization messages of project.
  - Object option
    - `pattern` (`string`) ... A glob for specifying files that store localization messages of project.
    - `localeKey` (`'file' | 'path' | 'key'`) ... Specifies how to determine the locale for localization messages.
      - `'file'` ... Determine the locale name from the filename. The resource file should only contain messages for that locale. Use this option if you use `vue-cli-plugin-i18n`. This option is also used when String option is specified.
      - `'path'` ... Determine the locale name from the path. In this case, the locale must be had structured with your rule on the path. It can be captured with the regular expression named capture. The resource file should only contain messages for that locale.
      - `'key'` ... Determine the locale name from the root key name of the file contents. The value of that key should only contain messages for that locale. Used when the resource file is in the format given to the `messages` option of the `VueI18n` constructor option.
    - `localePattern` ... Specifies how to determine pattern the locale for localization messages. This option means, when `localeKey` is `'path'`, you will need to capture the locale using a regular expression. You need to use the locale capture as a named capture `?<locale>`, so it’s be able to capture from the path of the locale resources. If you omit it, it will be captured from the resource path with the same regular expression pattern as `vue-cli-plugin-i18n`.
  - Array option ... An array of String option and Object option. Useful if you have multiple locale directories.
- `messageSyntaxVersion` (Optional) ... Specify the version of `vue-i18n` you are using. If not specified, the message will be parsed twice. Also, some rules require this setting.

::: warning NOTE

The `localePattern` options does not support SFC i18n custom blocks (`src` attribute), only for resources of files to import when specified in VueI18n's `messages` options (VueI18n v9 and later, `messages` specified in `createI18n`) for resources of files to import.

:::

### Running ESLint from command line

If you want to run `eslint` from command line, make sure you include the `.vue`, `.json`, `.json5`, `.yaml` and `.yml` extension using [the `--ext` option](https://eslint.org/docs/user-guide/configuring#specifying-file-extensions-to-lint) or a glob pattern because ESLint targets only `.js` files by default.

Examples:

```sh
eslint --ext .js,.vue,.json src
eslint "src/**/*.{js,vue,json}"
# Specify the extension you use.
# - use YAML?
# eslint --ext .js,.vue,.yaml,.yml src
# eslint "src/**/*.{js,vue,yaml,yml}"
# - use JSON5?
# eslint --ext .js,.vue,.json5 src
# eslint "src/**/*.{js,vue,json5}"
```

### How to use custom parser?

If you want to use custom parsers such as [babel-eslint](https://www.npmjs.com/package/babel-eslint) or [typescript-eslint-parser](https://www.npmjs.com/package/typescript-eslint-parser), you have to use `parserOptions.parser` option instead of `parser` option. Because this plugin requires [vue-eslint-parser](https://www.npmjs.com/package/vue-eslint-parser) to parse `.vue` files, so this plugin doesn't work if you overwrote `parser` option.

```diff
import vueEslintParser from "vue-eslint-parser"
import babelEslint from "babel-eslint"

export default {
  "files": ["**/*.vue"],
  "languageOptions": {
-   "parser": babelEslint,
+   "parser": vueEslintParser,
    "parserOptions": {
+     "parser": babelEslint,
      "sourceType": "module"
    },
  }
}
```

### More lint on JSON and YAML in `<i18n>` block

You can install [eslint-plugin-jsonc](https://ota-meshi.github.io/eslint-plugin-jsonc/) and [eslint-plugin-yml](https://ota-meshi.github.io/eslint-plugin-yml/). These 2 plugins support Vue custom blocks.

You can also use [jsonc/vue-custom-block/no-parsing-error](https://ota-meshi.github.io/eslint-plugin-jsonc/rules/vue-custom-block/no-parsing-error.html) and [yml/vue-custom-block/no-parsing-error](https://ota-meshi.github.io/eslint-plugin-yml/rules/vue-custom-block/no-parsing-error.html) rules to find JSON and YAML parsing errors.

## 🚥 Versioning policy

This plugin follows [Semantic Versioning].
However, please note that we do not follow [ESLint's Semantic Versioning Policy].
In minor version releases, this plugin may change the sharable configs provided by the plugin or the default behavior of the plugin's rules in order to add features to the plugin. Because we want to add many features to the plugin soon, so that users can easily take advantage of new features in Vue I18n, Vue and Nuxt.

According to our policy, any minor update may report more linting errors than the previous release. As such, we recommend using the [tilde (`~`)](https://semver.npmjs.com/#syntax-examples) in `package.json` to guarantee the results of your builds.

[Semantic Versioning]: https://semver.org/
[ESLint's Semantic Versioning Policy]: https://github.com/eslint/eslint#semantic-versioning-policy

## ❓ FAQ

### What is the "Use the latest vue-eslint-parser" error?

The most rules of `eslint-plugin-vue-i18n` require `vue-eslint-parser` to check `<template>` ASTs.

Make sure you have one of the following settings in your **eslint.config.js**:

- `plugin.configs.base`
- `plugin.configs.recommended`

See also: "[How to use custom parser](#how-to-use-custom-parser)" section.

### Why doesn't it work on .vue file?

1. Make sure you don't have `eslint-plugin-html` in your config. The `eslint-plugin-html` extracts the content from `<script>` tags, but `eslint-plugin-vue` requires `<script>` tags and `<template>` tags in order to distinguish template and script in single file components.

   ```diff
     "plugins": [
       "vue",
   -   "html"
     ]
   ```

2. Make sure your tool is set to lint `.vue` and `.json` files.

- CLI targets only `.js` files by default. You have to specify additional extensions by `--ext` option or glob patterns. E.g. `eslint "src/**/*.{js,vue,json}"` or `eslint src --ext .vue,.json`.
