/** DON'T EDIT THIS FILE; was created by scripts. */
// configs
import base from './configs/base'
import recommended from './configs/recommended'
import flatBase from './configs/flat/base'
import flatRecommended from './configs/flat/recommended'

// rules
import keyFormatStyle from './rules/key-format-style'
import noDeprecatedI18nComponent from './rules/no-deprecated-i18n-component'
import noDeprecatedI18nPlaceAttr from './rules/no-deprecated-i18n-place-attr'
import noDeprecatedI18nPlacesProp from './rules/no-deprecated-i18n-places-prop'
import noDeprecatedModuloSyntax from './rules/no-deprecated-modulo-syntax'
import noDeprecatedTc from './rules/no-deprecated-tc'
import noDuplicateKeysInLocale from './rules/no-duplicate-keys-in-locale'
import noDynamicKeys from './rules/no-dynamic-keys'
import noHtmlMessages from './rules/no-html-messages'
import noI18nTPathProp from './rules/no-i18n-t-path-prop'
import noMissingKeysInOtherLocales from './rules/no-missing-keys-in-other-locales'
import noMissingKeys from './rules/no-missing-keys'
import noRawText from './rules/no-raw-text'
import noUnknownLocale from './rules/no-unknown-locale'
import noUnusedKeys from './rules/no-unused-keys'
import noVHtml from './rules/no-v-html'
import preferLinkedKeyWithParen from './rules/prefer-linked-key-with-paren'
import preferSfcLangAttr from './rules/prefer-sfc-lang-attr'
import sfcLocaleAttr from './rules/sfc-locale-attr'
import validMessageSyntax from './rules/valid-message-syntax'

// export plugin
export = {
  configs: {
    // eslintrc configs
    base,
    recommended,

    // flat configs
    'flat/base': flatBase,
    'flat/recommended': flatRecommended
  },
  rules: {
    'key-format-style': keyFormatStyle,
    'no-deprecated-i18n-component': noDeprecatedI18nComponent,
    'no-deprecated-i18n-place-attr': noDeprecatedI18nPlaceAttr,
    'no-deprecated-i18n-places-prop': noDeprecatedI18nPlacesProp,
    'no-deprecated-modulo-syntax': noDeprecatedModuloSyntax,
    'no-deprecated-tc': noDeprecatedTc,
    'no-duplicate-keys-in-locale': noDuplicateKeysInLocale,
    'no-dynamic-keys': noDynamicKeys,
    'no-html-messages': noHtmlMessages,
    'no-i18n-t-path-prop': noI18nTPathProp,
    'no-missing-keys-in-other-locales': noMissingKeysInOtherLocales,
    'no-missing-keys': noMissingKeys,
    'no-raw-text': noRawText,
    'no-unknown-locale': noUnknownLocale,
    'no-unused-keys': noUnusedKeys,
    'no-v-html': noVHtml,
    'prefer-linked-key-with-paren': preferLinkedKeyWithParen,
    'prefer-sfc-lang-attr': preferSfcLangAttr,
    'sfc-locale-attr': sfcLocaleAttr,
    'valid-message-syntax': validMessageSyntax
  }
}
