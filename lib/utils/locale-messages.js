/**
 * @fileoverview Classes that acquires and manages localization messages
 * @author Yosuke Ota
 */
'use strict'

/**
 * @typedef {import('vue-eslint-parser').AST.VElement} VElement
 * @typedef {import('./index').LocaleKeyType} LocaleKeyType
 * @typedef {LocaleMessage} LocaleMessage
 * @typedef {LocaleMessages} LocaleMessages
 */
/**
 * The localization message class
 */
class LocaleMessage {
  /**
   * @param {object} arg
   * @param {string} arg.code Source code.
   * @param {string} arg.fullpath Absolute path.
   * @param {string} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   * @param {RuleContext} arg.context  The rule context
   * @param {SourceLocation} arg.loc  The block source code location
   * @returns {LocaleMessage}
   */
  static fromText ({ code, fullpath, locales, localeKey, context, loc }) {
    function parse () {
      try {
        return JSON.parse(code)
      } catch (e) {
        context.report({
          loc,
          message: e.message
        })
        return {}
      }
    }
    return new LocaleMessage({
      fullpath,
      locales,
      localeKey,
      loader: () => parse()
    })
  }
  /**
   * @param {object} arg
   * @param {string} arg.fullpath Absolute path.
   * @param {string} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   * @returns {LocaleMessage}
   */
  static fromFile ({ fullpath, locales, localeKey }) {
    return new LocaleMessage({
      fullpath,
      locales,
      localeKey,
      loader: () => require(fullpath)
    })
  }
  /**
   * @param {object} arg
   * @param {string} arg.fullpath Absolute path.
   * @param {string} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   * @param {()=>any} arg.loader Resource loader.
   */
  constructor ({ fullpath, locales, localeKey, loader }) {
    this.fullpath = fullpath
    /** @type {LocaleKeyType[]} Specifies how to determine the locale for localization messages. */
    this.localeKey = localeKey
    /** @type {string} The localization messages file name. */
    this.file = fullpath.replace(/^.*(\\|\/|:)/, '')

    this.loader = loader

    this._locales = locales

    /** @type {VElement} The element of `<i18n>`. */
    this.block = null
  }

  /**
   * @returns {object} The localization messages object.
   */
  get messages () {
    return this._messages || (this._messages = this.loader())
  }
  /**
   * @returns {string[]} Array of locales.
   */
  get locales () {
    if (this._locales) {
      return this._locales
    }
    if (this.localeKey === 'file') {
      // see https://github.com/kazupon/vue-cli-plugin-i18n/blob/e9519235a454db52fdafcd0517ce6607821ef0b4/generator/templates/js/src/i18n.js#L10
      const matched = this.file.match(/([A-Za-z0-9-_]+)\./i)
      return (this._locales = [matched && matched[1] || this.file])
    } else if (this.localeKey === 'key') {
      return (this._locales = Object.keys(this.messages))
    }
    return (this._locales = [])
  }

  findMissingPath (locale, key) {
    const paths = key.split('.')
    const length = paths.length
    let last = this._getMessagesFromLocale(locale)
    let i = 0
    while (i < length) {
      const value = last && last[paths[i]]
      if (value == null) {
        return paths.slice(0, i + 1).join('.')
      }
      last = value
      i++
    }
    return null
  }

  /**
   * Check if the message with the given key exists.
   * @param {string} locale The locale name
   * @param {string} key The given key to check
   * @returns {boolean}
   */
  hasMessage (locale, key) {
    return this.getMessage(locale, key) != null
  }

  /**
   * Gets the message for the given key.
   * @param {string} locale The locale name
   * @param {string} key The given key
   * @returns {any} The message for the given key. `null` if the message is missing.
   */
  getMessage (locale, key) {
    const paths = key.split('.')
    const length = paths.length
    let last = this._getMessagesFromLocale(locale)
    let i = 0
    while (i < length) {
      const value = last && last[paths[i]]
      if (value == null) {
        return null
      }
      last = value
      i++
    }
    return last
  }

  _getMessagesFromLocale (locale) {
    if (this.localeKey === 'file') {
      return this.messages
    }
    if (this.localeKey === 'key') {
      return this.messages[locale]
    }
  }
}

/**
 * The localization messages class
 */
class LocaleMessages {
  /**
   * @param {LocaleMessage[]} localeMessages
   */
  constructor (localeMessages) {
    this.localeMessages = localeMessages
  }

  /**
   * Checks whether it is empty.
   */
  isEmpty () {
    return this.localeMessages.length <= 0
  }

  /**
   * Finds and gets the localization message for the given fullpath.
   * @param {string} fullpath
   * @returns {LocaleMessage}
   */
  findExistLocaleMessage (fullpath) {
    return this.localeMessages.find(message => message.fullpath === fullpath)
  }

  /**
   * Finds and gets the localization message for the given block.
   * @param {VElement} block
   * @returns {LocaleMessage}
   */
  findBlockLocaleMessage (block) {
    return this.localeMessages.find(message => message.block === block)
  }

  /**
   * Finds the paths that does not exist in the localization message resources.
   * @param {string} key
   */
  findMissingPaths (key) {
    const missings = []
    this.localeMessages.forEach(localeMessage => {
      localeMessage.locales.forEach(locale => {
        const missingPath = localeMessage.findMissingPath(locale, key)
        if (missingPath) {
          missings.push({ path: missingPath, locale })
        }
      })
    })
    return missings.sort(({ locale: localeA }, { locale: localeB },) => localeA > localeB ? 1 : localeA < localeB ? -1 : 0)
  }
}

module.exports = {
  LocaleMessage,
  LocaleMessages
}
