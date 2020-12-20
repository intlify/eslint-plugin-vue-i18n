# Getting Started

## :cd: Installation

Use [npm](https://www.npmjs.com/) or a compatible tool.

```sh
npm install --save-dev eslint @intlify/eslint-plugin-vue-i18n
```

::: tip Requirements
- ESLint v5.0.0 or later
- Node.js v10.13.0 or later
:::

## :rocket: Usage

Configure your `.eslintrc.*` file.

For example:

```js
module.export = {
  extends: [
    'eslint:recommended',
    // Recommended
    'plugin:@intlify/vue-i18n/recommended'
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
      localeDir: './path/to/locales/*.{json,json5,yaml,yml}' // extension is glob formatting!
      // or
      // localeDir: {
      //   pattern: './path/to/locales/*.{json,json5,yaml,yml}', // extension is glob formatting!
      //   localeKey: 'file' // or 'key'
      // }
      // or
      // localeDir: [
      //   {
      //     pattern: './path/to/locales1/*.{json,json5,yaml,yml}',
      //     localeKey: 'file' // or 'key'
      //   },
      //   {
      //     pattern: './path/to/locales2/*.{json,json5,yaml,yml}',
      //     localeKey: 'file' // or 'key'
      //   },
      // ]
    }
  }
}
```

See [the rule list](../rules/)

### `settings['vue-i18n']`

- `localeDir` ... You can specify a string or an object or an array.
  - String option ... A glob for specifying files that store localization messages of project.
  - Object option
    - `pattern` (`string`) ... A glob for specifying files that store localization messages of project.
    - `localeKey` (`'file' | 'key'`) ... Specifies how to determine the locale for localization messages.
      - `'file'` ... Determine the locale name from the filename. The resource file should only contain messages for that locale. Use this option if you use `vue-cli-plugin-i18n`. This option is also used when String option is specified.
      - `'key'` ...  Determine the locale name from the root key name of the file contents. The value of that key should only contain messages for that locale. Used when the resource file is in the format given to the `messages` option of the `VueI18n` constructor option.
  - Array option ... An array of String option and Object option. Useful if you have multiple locale directories.

### Running ESLint from command line

If you want to run `eslint` from command line, make sure you include the `.vue`, `.json`, `.json5`, `.yaml` and `.yml` extension using [the `--ext` option](https://eslint.org/docs/user-guide/configuring#specifying-file-extensions-to-lint) or a glob pattern because ESLint targets only `.js` files by default.

Examples:

```bash
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

Also, `parserOptions` configured at the top level affect `.json` and `.yaml`. This plugin needs to use special parsers to parse `.json` and `.yaml`, so to correctly parse each extension, use the `overrides` option and overwrite the options again.

```diff
- "parser": "babel-eslint",
  "parserOptions": {
+     "parser": "babel-eslint",
      "sourceType": "module"
  },
+ "overrides": [
+     {
+         "files": ["*.json", "*.json5"],
+         "extends": ["plugin:@intlify/vue-i18n/base"],
+     },
+     {
+         "files": ["*.yaml", "*.yml"],
+         "extends": ["plugin:@intlify/vue-i18n/base"],
+     }
+ ]
```

### More lint on JSON and YAML in `<i18n>` block

You can install [eslint-plugin-jsonc](https://ota-meshi.github.io/eslint-plugin-jsonc/) and [eslint-plugin-yml](https://ota-meshi.github.io/eslint-plugin-yml/). These 2 plugins support Vue custom blocks.

You can also use [jsonc/vue-custom-block/no-parsing-error](https://ota-meshi.github.io/eslint-plugin-jsonc/rules/vue-custom-block/no-parsing-error.html) and [yml/vue-custom-block/no-parsing-error](https://ota-meshi.github.io/eslint-plugin-yml/rules/vue-custom-block/no-parsing-error.html) rules to find JSON and YAML parsing errors.

## :question: FAQ

### What is the "Use the latest vue-eslint-parser" error?

The most rules of `eslint-plugin-vue-i18n` require `vue-eslint-parser` to check `<template>` ASTs.

Make sure you have one of the following settings in your **.eslintrc**:

- `"extends": ["plugin:@intlify/vue-i18n/recommended"]`
- `"extends": ["plugin:@intlify/vue-i18n/base"]`

If you already use other parser (e.g. `"parser": "babel-eslint"`), please move it into `parserOptions`, so it doesn't collide with the `vue-eslint-parser` used by this plugin's configuration:

```diff
- "parser": "babel-eslint",
  "parserOptions": {
+     "parser": "babel-eslint",
      "ecmaVersion": 2017,
      "sourceType": "module"
  }
```

See also: "[Use together with custom parsers](#use-together-with-custom-parsers)" section.

### Why doesn't it work on .vue file?

1. Make sure you don't have `eslint-plugin-html` in your config. The `eslint-plugin-html` extracts the content from `<script>` tags, but `eslint-plugin-vue` requires `<script>` tags and `<template>` tags in order to distinguish template and script in single file components.

  ```diff
    "plugins": [
      "vue",
  -   "html"
    ]
  ```

2. Make sure your tool is set to lint `.vue` and `.json` files.
  - CLI targets only `.js` files by default. You have to specify additional extensions by `--ext` option or glob patterns. E.g. `eslint "src/**/*.{js,vue,json}"` or `eslint src --ext .vue,.json`.o
