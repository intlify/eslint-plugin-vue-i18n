/**
 * @fileoverview Classes that acquires and manages localization messages
 * @author Yosuke Ota
 */
import type { AST as JSONAST } from 'eslint-plugin-jsonc'
import type { AST as YAMLAST } from 'yaml-eslint-parser'
import type { AST as VAST } from 'vue-eslint-parser'
import type {
  RuleContext,
  I18nLocaleMessageDictionary,
  I18nLocaleMessageValue,
  SourceCode,
  LocaleKeyType
} from '../types'
import { extname } from 'path'
import fs from 'fs'
import {
  parseJsonInI18nBlock,
  parseYamlInI18nBlock,
  Visitor,
  Parsed
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

  findMissingPath(locale: string, key: string): string | null {
    const paths = key.split('.')
    const length = paths.length
    let last: I18nLocaleMessageValue = this._getMessagesFromLocale(locale)
    let i = 0
    while (i < length) {
      const value: I18nLocaleMessageValue | undefined =
        last && typeof last !== 'string' ? last[paths[i]] : undefined
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
  hasMessage(locale: string, key: string): boolean {
    return this.getMessage(locale, key) != null
  }

  /**
   * Gets the message for the given key.
   * @param {string} locale The locale name
   * @param {string} key The given key
   * @returns {any} The message for the given key. `null` if the message is missing.
   */
  getMessage(locale: string, key: string): I18nLocaleMessageValue | null {
    const paths = key.split('.')
    const length = paths.length
    let last: I18nLocaleMessageValue = this._getMessagesFromLocale(locale)
    let i = 0
    while (i < length) {
      const value: I18nLocaleMessageValue | undefined =
        last && typeof last !== 'string' ? last[paths[i]] : undefined
      if (value == null) {
        return null
      }
      last = value
      i++
    }
    return last ?? null
  }

  _getMessagesFromLocale(locale: string): I18nLocaleMessageDictionary {
    if (this.localeKey === 'file') {
      return this.messages
    }
    if (this.localeKey === 'key') {
      return this.messages[locale] as I18nLocaleMessageDictionary
    }
    return {}
  }
}

export class BlockLocaleMessage extends LocaleMessage {
  private context: RuleContext
  public readonly block: VAST.VElement
  private lang: string
  private _parsed: Parsed<JSONAST.JSONNode | YAMLAST.YAMLNode> | null = null
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
    context,
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

    this.context = context
    this.block = block
    this.lang = lang || 'json'
  }

  getMessagesInternal(): I18nLocaleMessageDictionary {
    if (this._messages) {
      return this._messages
    }
    const parsed = this._getParsed()
    if (!parsed) {
      return {}
    }
    return (this._messages = parsed.getStaticValue(parsed.ast))
  }

  getAST(): JSONAST.JSONProgram | YAMLAST.YAMLProgram | null {
    const parsed = this._getParsed()
    if (!parsed) {
      return null
    }
    return parsed.ast
  }
  getParserLang(): string | null {
    const parsed = this._getParsed()
    if (!parsed) {
      return null
    }
    return parsed.lang
  }
  /**
   * @param {Visitor} visitor
   */
  traverseNodes(visitor: Visitor): void {
    const parsed = this._getParsed()
    if (!parsed) {
      return
    }
    parsed.traverseNodes(parsed.ast, visitor)
  }
  getSourceCode(): SourceCode | null {
    const parsed = this._getParsed()
    if (!parsed) {
      return null
    }
    return parsed.getSourceCode()
  }

  _getParsed(): Parsed<JSONAST.JSONNode | YAMLAST.YAMLNode> | null {
    if (this._parsed) {
      return this._parsed
    }

    const { lang } = this
    if (lang === 'json' || lang === 'json5') {
      return (this._parsed = parseJsonInI18nBlock(this.context, this.block))
    } else if (lang === 'yaml' || lang === 'yml') {
      return (this._parsed = parseYamlInI18nBlock(this.context, this.block))
    }
    return null
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
    this.localeMessages.forEach(localeMessage => {
      localeMessage.locales.forEach(locale => {
        const missingPath = localeMessage.findMissingPath(locale, key)
        if (missingPath) {
          missings.push({ path: missingPath, locale })
        }
      })
    })
    return missings.sort(({ locale: localeA }, { locale: localeB }) =>
      localeA > localeB ? 1 : localeA < localeB ? -1 : 0
    )
  }
}
