/**
 * @fileoverview Classes that acquires and manages localization messages
 * @author Yosuke Ota
 */
'use strict'

const { parseJsonInI18nBlock } = require('./json-parsers')
const ResourceLoader = require('./resource-loader')
const { getStaticJSONValue } = require('eslint-plugin-jsonc')

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
   * @param {string} arg.fullpath Absolute path.
   * @param {string[]} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   */
  constructor ({ fullpath, locales, localeKey }) {
    this.fullpath = fullpath
    /** @type {LocaleKeyType[]} Specifies how to determine the locale for localization messages. */
    this.localeKey = localeKey
    /** @type {string} The localization messages file name. */
    this.file = fullpath.replace(/^.*(\\|\/|:)/, '')

    this._locales = locales
  }

  loadMessages () {
    // abstract
  }

  /**
   * @protected
   */
  getMessagesInternal () {
    if (this._messages) {
      return this._messages
    }
    return (this._messages = this.loadMessages())
  }

  /**
   * @returns {object} The localization messages object.
   */
  get messages () {
    return this.getMessagesInternal()
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

class BlockLocaleMessage extends LocaleMessage {
  /**
   * @param {object} arg
   * @param {VElement} arg.block `<i18n>` block.
   * @param {string} arg.fullpath Absolute path.
   * @param {string[]} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   * @param {RuleContext} arg.context  The rule context
   * @param {string} arg.lang  The language of resource
   * @returns {LocaleMessage}
   */
  constructor ({ block, fullpath, locales, localeKey, context, lang = 'json' }) {
    super({
      fullpath,
      locales,
      localeKey
    })

    this.context = context
    this.block = block
    this.lang = lang // TODO language supports
  }

  loadMessages () {
    const parsed = this._getJsonParsed()
    if (!parsed) {
      return {}
    }
    return getStaticJSONValue(parsed.ast)
  }

  getJsonAST () {
    const parsed = this._getJsonParsed()
    if (!parsed) {
      return null
    }
    return parsed.ast
  }
  getJsonSourceCode () {
    const parsed = this._getJsonParsed()
    if (!parsed) {
      return null
    }
    return parsed.getSourceCode()
  }

  _getJsonParsed () {
    if (this._jsonParsed) {
      return this._jsonParsed
    }

    return (this._jsonParsed = parseJsonInI18nBlock(this.context, this.block))
  }
}

class FileLocaleMessage extends LocaleMessage {
  /**
   * @param {object} arg
   * @param {string} arg.fullpath Absolute path.
   * @param {string[]} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   */
  constructor ({ fullpath, locales, localeKey }) {
    super({
      fullpath,
      locales,
      localeKey
    })
    this._resource = new ResourceLoader(fullpath, (p) => {
      const key = require.resolve(p)
      delete require.cache[key]
      return require(p)
    })
  }

  getMessagesInternal () {
    return this._resource.getResource()
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
   * @returns {BlockLocaleMessage}
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
  FileLocaleMessage,
  BlockLocaleMessage,
  LocaleMessages
}
