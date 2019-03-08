# :globe_with_meridians: eslint-plugin-vue-i18n

ESLint plugin for Vue I18n

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

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:vue-i18n/recommended"
  ],
  "rules": {
    // Optional.
    "vue-i18n/no-dynamic-key": "error"
  }
}
```

## :white_check_mark: TODO
- [x] no-missing-key
- [ ] no-dynamic-key
- [ ] no-unused-key
- [ ] no-raw-text
- [ ] valid-message-syntax
- [ ] keys-order
- [ ] replace documentation example with `eslint-playground` component

## :copyright: License

[MIT](http://opensource.org/licenses/MIT)