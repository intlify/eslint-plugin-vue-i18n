# Getting Started

<a href="https://www.patreon.com/kazupon" target="_blank">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patreon">
</a>

## :cd: Installation

Use [npm](https://www.npmjs.com/) or a compatible tool.

```sh
npm install --save-dev eslint eslint-plugin-vue-i18n
```

## :rocket: Usage

Configure your `.eslintrc.*` file.

For example:

```js
{
  "extends": [
    "eslint:recommended",
    "plugin:vue-i18n/recommended"
  ],
  "rules": {
    // Optional.
    "vue-i18n/no-dynamic-key": "error"
  },
  "settings": {
    "vue-i18n": {
      "localeDir": "./pato/to/locales/*.json" // extention is glob formatting!
    }
  }
}
```
