# Getting Started

## :cd: Installation

Use [npm](https://www.npmjs.com/) or a compatible tool.

```sh
npm install --save-dev eslint eslint-plugin-vue-i18n
```

## :rocket: Usage

Configure your `.eslintrc.*` file.

For example:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:vue-i18n/recommended"
  ],
  "rules": {
    // Optional.
    "vue-i18n/no-missing-key": "error"
  }
}
```