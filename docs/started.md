# Getting Started

## :cd: Installation

Use [npm](https://www.npmjs.com/) or a compatible tool.

```sh
npm install --save-dev eslint eslint-plugin-vue-i18n
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
    'plugin:vue-i18n/recommended'
  ],
  rules: {
    // Optional.
    'vue-i18n/no-dynamic-keys': 'error',
    'vue-i18n/no-unused-keys': ['error', {
      extensions: ['.js', '.vue']
    }]
  },
  settings: {
    'vue-i18n': {
      localeDir: './path/to/locales/*.json' // extention is glob formatting!
    }
  }
}
```

See [the rule list](../rules/)

### Running ESLint from command line

If you want to run `eslint` from command line, make sure you include the `.vue` and `.json` extension using [the `--ext` option](https://eslint.org/docs/user-guide/configuring#specifying-file-extensions-to-lint) or a glob pattern because ESLint targets only `.js` files by default.

Examples:

```bash
eslint --ext .js,.vue,.json src
eslint "src/**/*.{js,vue,json}"
```

#### How to use custom parser?

If you want to use custom parsers such as [babel-eslint](https://www.npmjs.com/package/babel-eslint) or [typescript-eslint-parser](https://www.npmjs.com/package/typescript-eslint-parser), you have to use `parserOptions.parser` option instead of `parser` option. Because this plugin requires [vue-eslint-parser](https://www.npmjs.com/package/vue-eslint-parser) to parse `.vue` files, so this plugin doesn't work if you overwrote `parser` option.

```diff
- "parser": "babel-eslint",
  "parserOptions": {
+     "parser": "babel-eslint",
      "sourceType": "module"
  }
```

## :question: FAQ

### What is the "Use the latest vue-eslint-parser" error?

The most rules of `eslint-plugin-vue-i18n` require `vue-eslint-parser` to check `<template>` ASTs.

Make sure you have one of the following settings in your **.eslintrc**:

- `"extends": ["plugin:vue-i18n/recommended"]`

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
