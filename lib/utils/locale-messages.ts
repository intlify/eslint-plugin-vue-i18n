/**
 * @fileoverview Classes that acquires and manages localization messages
 * @author Yosuke Ota
 */
import type { AST as VAST } from 'vue-eslint-parser'
import type {
  RuleContext,
  I18nLocaleMessageDictionary,
  I18nLocaleMessageValue,
  LocaleKeyType
} from '../types'
import { extname } from 'path'
import fs from 'fs'
import {
  parseYamlValuesInI18nBlock,
  parseJsonValuesInI18nBlock
} from './parsers'
import { ResourceLoader } from './resource-loader'
import JSON5 from 'json5'
import yaml from 'js-yaml'

/**
 * The localization message class
 */
export abstract class LocaleMessage {
  public readonly fullpath: string
  public readonly localeKey: LocaleKeyType
  public readonly file: string
  private _locales: string[] | undefined
  /**
   * @param {object} arg
   * @param {string} arg.fullpath Absolute path.
   * @param {string[]} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   */
  constructor({
    fullpath,
    locales,
    localeKey
  }: {
    fullpath: string
    locales?: string[]
    localeKey: LocaleKeyType
  }) {
    this.fullpath = fullpath
    /** @type {LocaleKeyType} Specifies how to determine the locale for localization messages. */
    this.localeKey = localeKey
    /** @type {string} The localization messages file name. */
    this.file = fullpath.replace(/^.*(\\|\/|:)/, '')

    this._locales = locales
  }

  /**
   * @protected
   */
  abstract getMessagesInternal(): I18nLocaleMessageDictionary

  /**
   * @returns {object} The localization messages object.
   */
  get messages(): I18nLocaleMessageDictionary {
    return this.getMessagesInternal()
  }
  /**
   * @returns {string[]} Array of locales.
   */
  get locales(): string[] {
    if (this._locales) {
      return this._locales
    }
    if (this.localeKey === 'file') {
      // see https://github.com/kazupon/vue-cli-plugin-i18n/blob/e9519235a454db52fdafcd0517ce6607821ef0b4/generator/templates/js/src/i18n.js#L10
      const matched = this.file.match(/([A-Za-z0-9-_]+)\./i)
      return (this._locales = [(matched && matched[1]) || this.file])
    } else if (this.localeKey === 'key') {
      return (this._locales = Object.keys(this.messages))
    }
    return (this._locales = [])
  }

  /**
   * Gets messages for the given locale.
   */
  getMessagesFromLocale(locale: string): I18nLocaleMessageDictionary {
    if (this.localeKey === 'file') {
      if (!this.locales.includes(locale)) {
        return {}
      }
      return this.messages
    }
    if (this.localeKey === 'key') {
      return (this.messages[locale] || {}) as I18nLocaleMessageDictionary
    }
    return {}
  }
}

export class BlockLocaleMessage extends LocaleMessage {
  public readonly block: VAST.VElement
  private lang: string
  private _messages: I18nLocaleMessageDictionary | null = null
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
  constructor({
    block,
    fullpath,
    locales,
    localeKey,
    lang = 'json'
  }: {
    block: VAST.VElement
    fullpath: string
    locales?: string[]
    localeKey: LocaleKeyType
    context: RuleContext
    lang?: string
  }) {
    super({
      fullpath,
      locales,
      localeKey
    })

    this.block = block
    this.lang = lang || 'json'
  }

  getMessagesInternal(): I18nLocaleMessageDictionary {
    if (this._messages) {
      return this._messages
    }
    const { lang } = this
    if (lang === 'json' || lang === 'json5') {
      this._messages = parseJsonValuesInI18nBlock(this.block) || {}
    } else if (lang === 'yaml' || lang === 'yml') {
      this._messages = parseYamlValuesInI18nBlock(this.block) || {}
    } else {
      this._messages = {}
    }
    return this._messages
  }
}

export class FileLocaleMessage extends LocaleMessage {
  private _resource: ResourceLoader<I18nLocaleMessageDictionary>
  /**
   * @param {object} arg
   * @param {string} arg.fullpath Absolute path.
   * @param {string[]} [arg.locales] The locales.
   * @param {LocaleKeyType} arg.localeKey Specifies how to determine the locale for localization messages.
   */
  constructor({
    fullpath,
    locales,
    localeKey
  }: {
    fullpath: string
    locales?: string[]
    localeKey: LocaleKeyType
  }) {
    super({
      fullpath,
      locales,
      localeKey
    })
    this._resource = new ResourceLoader(fullpath, fileName => {
      const ext = extname(fileName).toLowerCase()
      if (ext === '.json' || ext === '.js') {
        const key = require.resolve(fileName)
        delete require.cache[key]
        return require(fileName)
      } else if (ext === '.yaml' || ext === '.yml') {
        return yaml.safeLoad(fs.readFileSync(fileName, 'utf8'))
      } else if (ext === '.json5') {
        return JSON5.parse(fs.readFileSync(fileName, 'utf8'))
      }
    })
  }

  getMessagesInternal(): I18nLocaleMessageDictionary {
    return this._resource.getResource()
  }
}

/**
 * The localization messages class
 */
export class LocaleMessages {
  public readonly localeMessages: LocaleMessage[]
  /**
   * @param {LocaleMessage[]} localeMessages
   */
  constructor(localeMessages: LocaleMessage[]) {
    this.localeMessages = localeMessages
  }

  get locales(): string[] {
    const locales = new Set<string>()
    for (const localeMessage of this.localeMessages) {
      for (const locale of localeMessage.locales) {
        locales.add(locale)
      }
    }
    return [...locales]
  }

  /**
   * Checks whether it is empty.
   */
  isEmpty(): boolean {
    return this.localeMessages.length <= 0
  }

  /**
   * Finds and gets the localization message for the given fullpath.
   * @param {string} fullpath
   * @returns {LocaleMessage}
   */
  findExistLocaleMessage(fullpath: string): LocaleMessage | null {
    return (
      this.localeMessages.find(message => message.fullpath === fullpath) || null
    )
  }

  /**
   * Finds and gets the localization message for the given block.
   * @param {VElement} block
   * @returns {BlockLocaleMessage}
   */
  findBlockLocaleMessage(block: VAST.VElement): BlockLocaleMessage | null {
    return (
      this.localeMessages.find(
        (message): message is BlockLocaleMessage =>
          (message as BlockLocaleMessage).block === block
      ) || null
    )
  }

  /**
   * Finds the paths that does not exist in the localization message resources.
   * @param {string} key
   */
  findMissingPaths(key: string): { path: string; locale: string }[] {
    const missings: { path: string; locale: string }[] = []
    for (const locale of this.locales) {
      const paths = key.split('.')
      const length = paths.length
      let lasts: I18nLocaleMessageValue[] = this.localeMessages.map(lm =>
        lm.getMessagesFromLocale(locale)
      )
      let i = 0
      while (i < length) {
        const values: I18nLocaleMessageValue[] = lasts
          .map(last => {
            return last && typeof last !== 'string' ? last[paths[i]] : undefined
          })
          .filter((val): val is I18nLocaleMessageValue => val != null)

        if (values.length === 0) {
          missings.push({
            locale,
            path: paths.slice(0, i + 1).join('.')
          })
          break
        }
        lasts = values
        i++
      }
    }
    return missings.sort(({ locale: localeA }, { locale: localeB }) =>
      localeA > localeB ? 1 : localeA < localeB ? -1 : 0
    )
  }
}
