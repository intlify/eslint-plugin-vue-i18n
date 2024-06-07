/**
 * @fileoverview Utilities for eslint plugin
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
import type { AST as VAST } from 'vue-eslint-parser'
import { sync } from 'glob'
import { resolve, dirname, extname } from 'path'
import {
  FileLocaleMessage,
  BlockLocaleMessage,
  LocaleMessages
} from './locale-messages'
import { CacheLoader } from './cache-loader'
import { defineCacheFunction } from './cache-function'
import type {
  RuleContext,
  TemplateListener,
  RuleListener,
  LocaleKeyType,
  SettingsVueI18nLocaleDir,
  SettingsVueI18nLocaleDirObject,
  SettingsVueI18nLocaleDirGlob,
  CustomBlockVisitorFactory
} from '../types'
import * as jsoncESLintParser from 'jsonc-eslint-parser'
import * as yamlESLintParser from 'yaml-eslint-parser'
import { getCwd } from './get-cwd'
import { getFilename, getSourceCode } from './compat'

interface LocaleFiles {
  files: string[]
  localeKey: LocaleKeyType
  localePattern?: string | RegExp
}
const UNEXPECTED_ERROR_LOCATION = { line: 1, column: 0 }
/**
 * Register the given visitor to parser services.
 * Borrow from GitHub `vuejs/eslint-plugin-vue` repo
 * @see https://github.com/vuejs/eslint-plugin-vue/blob/master/lib/utils/index.js#L54
 */
export function defineTemplateBodyVisitor(
  context: RuleContext,
  templateBodyVisitor: TemplateListener,
  scriptVisitor?: RuleListener
): RuleListener {
  const sourceCode = getSourceCode(context)
  if (sourceCode.parserServices.defineTemplateBodyVisitor == null) {
    const filename = getFilename(context)
    if (extname(filename) === '.vue') {
      context.report({
        loc: UNEXPECTED_ERROR_LOCATION,
        message:
          'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error'
      })
    }
    return {}
  }
  return sourceCode.parserServices.defineTemplateBodyVisitor(
    templateBodyVisitor,
    scriptVisitor
  )
}

/**
 * Get the attribute which has the given name.
 * @param {VElement} node The start tag node to check.
 * @param {string} name The attribute name to check.
 * @param {string} [value] The attribute value to check.
 * @returns {VAttribute | null} The found attribute.
 */
export function getAttribute(
  node: VAST.VElement,
  name: string
): VAST.VAttribute | null {
  return (
    node.startTag.attributes
      .map(node => (!node.directive ? node : null))
      .find(node => {
        return node && node.key.name === name
      }) || null
  )
}

/**
 * Get the directive which has the given name.
 * @param {VElement} node The start tag node to check.
 * @param {string} name The directive name to check.
 * @param {string} [argument] The directive argument to check.
 * @returns {VDirective | null} The found directive.
 */
export function getDirective(
  node: VAST.VElement,
  name: string,
  argument: string
): VAST.VDirective | null {
  return (
    node.startTag.attributes
      .map(node => (node.directive ? node : null))
      .find(node => {
        return (
          node &&
          node.key.name.name === name &&
          (argument === undefined ||
            (node.key.argument &&
              node.key.argument.type === 'VIdentifier' &&
              node.key.argument.name) === argument)
        )
      }) || null
  )
}

export type StaticLiteral = VAST.ESLintLiteral | VAST.ESLintTemplateLiteral
export function isStaticLiteral(node: VAST.Node | null): node is StaticLiteral {
  return Boolean(
    node &&
      (node.type === 'Literal' ||
        (node.type === 'TemplateLiteral' && node.expressions.length === 0))
  )
}
export function getStaticLiteralValue(
  node: StaticLiteral
): VAST.ESLintLiteral['value'] {
  return node.type !== 'TemplateLiteral'
    ? node.value
    : node.quasis[0].value.cooked || node.quasis[0].value.raw
}

function loadLocaleMessages(
  localeFilesList: LocaleFiles[],
  cwd: string
): FileLocaleMessage[] {
  const results: FileLocaleMessage[] = []
  const checkDupeMap: { [file: string]: LocaleKeyType[] } = {}
  for (const { files, localeKey, localePattern } of localeFilesList) {
    for (const file of files) {
      const localeKeys = checkDupeMap[file] || (checkDupeMap[file] = [])
      if (localeKeys.includes(localeKey)) {
        continue
      }
      localeKeys.push(localeKey)
      const fullpath = resolve(cwd, file)
      results.push(
        new FileLocaleMessage({ fullpath, localeKey, localePattern })
      )
    }
  }
  return results
}

/** @type {Set<RuleContext>} */
const puttedSettingsError = new WeakSet<RuleContext>()

/**
 * @param {RuleContext} context
 * @returns {LocaleMessages}
 */
export function getLocaleMessages(
  context: RuleContext,
  options?: { ignoreMissingSettingsError?: boolean }
): LocaleMessages {
  const sourceCode = getSourceCode(context)
  const { settings } = context
  /** @type {SettingsVueI18nLocaleDir | null} */
  const localeDir =
    (settings['vue-i18n'] && settings['vue-i18n'].localeDir) || null
  const documentFragment =
    sourceCode.parserServices.getDocumentFragment &&
    sourceCode.parserServices.getDocumentFragment()
  /** @type {VElement[]} */
  const i18nBlocks =
    (documentFragment &&
      documentFragment.children.filter(
        (node): node is VAST.VElement =>
          node.type === 'VElement' && node.name === 'i18n'
      )) ||
    []
  if (!localeDir && !i18nBlocks.length) {
    if (
      !puttedSettingsError.has(context) &&
      !options?.ignoreMissingSettingsError
    ) {
      context.report({
        loc: UNEXPECTED_ERROR_LOCATION,
        message: `You need to set 'localeDir' at 'settings', or '<i18n>' blocks. See the 'eslint-plugin-vue-i18n' documentation`
      })
      puttedSettingsError.add(context)
    }
    return new LocaleMessages([])
  }

  return new LocaleMessages([
    ...(getLocaleMessagesFromI18nBlocks(context, i18nBlocks) || []),
    ...((localeDir &&
      localeDirLocaleMessagesCache.getLocaleMessagesFromLocaleDir(
        context,
        localeDir
      )) ||
      [])
  ])
}

class LocaleDirLocaleMessagesCache {
  private _targetFilesLoader: CacheLoader<[string, string], string[]>
  private _loadLocaleMessages: (
    localeFilesList: LocaleFiles[],
    cwd: string
  ) => FileLocaleMessage[]
  constructor() {
    this._targetFilesLoader = new CacheLoader((pattern, cwd) =>
      sync(pattern, { cwd })
    )

    this._loadLocaleMessages = defineCacheFunction(
      (localeFilesList: LocaleFiles[], cwd) => {
        return loadLocaleMessages(localeFilesList, cwd)
      }
    )
  }
  /**
   * @param {SettingsVueI18nLocaleDir} localeDir
   * @returns {LocaleMessage[]}
   */
  getLocaleMessagesFromLocaleDir(
    context: RuleContext,
    localeDir: SettingsVueI18nLocaleDir
  ) {
    const cwd = getCwd(context)
    let localeFilesList: LocaleFiles[]
    if (Array.isArray(localeDir)) {
      localeFilesList = localeDir.map(dir => this._toLocaleFiles(dir, cwd))
    } else {
      localeFilesList = [this._toLocaleFiles(localeDir, cwd)]
    }
    return this._loadLocaleMessages(localeFilesList, cwd)
  }

  private _toLocaleFiles(
    localeDir: SettingsVueI18nLocaleDirGlob | SettingsVueI18nLocaleDirObject,
    cwd: string
  ): LocaleFiles {
    const targetFilesLoader = this._targetFilesLoader
    if (typeof localeDir === 'string') {
      return {
        files: targetFilesLoader.get(localeDir, cwd),
        localeKey: 'file'
      }
    } else {
      return {
        files: targetFilesLoader.get(localeDir.pattern, cwd),
        localeKey: String(localeDir.localeKey ?? 'file') as LocaleKeyType,
        localePattern: localeDir.localePattern
      }
    }
  }
}

const localeDirLocaleMessagesCache = new LocaleDirLocaleMessagesCache()

/** @type {Map<Program, LocaleMessage[]>} */
const i18nBlockLocaleMessages = new WeakMap()

/**
 * @param {RuleContext} context
 * @param {VElement[]} i18nBlocks
 * @returns {LocaleMessage[]}
 */
function getLocaleMessagesFromI18nBlocks(
  context: RuleContext,
  i18nBlocks: VAST.VElement[]
) {
  const sourceCode = getSourceCode(context)
  let localeMessages = i18nBlockLocaleMessages.get(sourceCode.ast)
  if (localeMessages) {
    return localeMessages
  }
  const filename = getFilename(context)
  localeMessages = i18nBlocks
    .map(block => {
      const attrs = getStaticAttributes(block)
      let localeMessage = null
      if (attrs.src) {
        const fullpath = resolve(dirname(filename), attrs.src)

        if (attrs.locale) {
          localeMessage = new FileLocaleMessage({
            fullpath,
            locales: [attrs.locale],
            localeKey: 'file'
          })
        } else {
          localeMessage = new FileLocaleMessage({
            fullpath,
            localeKey: 'key'
          })
        }
      } else if (block.endTag) {
        if (attrs.locale) {
          localeMessage = new BlockLocaleMessage({
            block,
            fullpath: filename,
            locales: [attrs.locale],
            localeKey: 'file',
            context,
            lang: attrs.lang
          })
        } else {
          localeMessage = new BlockLocaleMessage({
            block,
            fullpath: filename,
            localeKey: 'key',
            context,
            lang: attrs.lang
          })
        }
      }

      if (localeMessage) {
        return localeMessage
      }
      // unknown
      return null
    })
    .filter(e => e)
  i18nBlockLocaleMessages.set(sourceCode.ast, localeMessages)
  return localeMessages
}

export function defineCustomBlocksVisitor(
  context: RuleContext,
  jsonRule: CustomBlockVisitorFactory,
  yamlRule: CustomBlockVisitorFactory
): RuleListener {
  const sourceCode = getSourceCode(context)
  if (!sourceCode.parserServices.defineCustomBlocksVisitor) {
    return {}
  }
  const jsonVisitor = sourceCode.parserServices.defineCustomBlocksVisitor(
    context,
    jsoncESLintParser,
    {
      target(lang: string | null, block: VAST.VElement): boolean {
        if (block.name !== 'i18n') {
          return false
        }
        return !lang || lang === 'json' || lang === 'json5'
      },
      create: jsonRule
    }
  )
  const yamlVisitor = sourceCode.parserServices.defineCustomBlocksVisitor(
    context,
    yamlESLintParser,
    {
      target(lang: string | null, block: VAST.VElement): boolean {
        if (block.name !== 'i18n') {
          return false
        }
        return lang === 'yaml' || lang === 'yml'
      },
      create: yamlRule
    }
  )

  return compositingVisitors(jsonVisitor, yamlVisitor)
}

export type VueObjectType =
  | 'mark'
  | 'export'
  | 'definition'
  | 'instance'
  | 'variable'
  | 'components-option'
/**
 * If the given object is a Vue component or instance, returns the Vue definition type.
 * @param context The ESLint rule context object.
 * @param node Node to check
 * @returns The Vue definition type.
 */
export function getVueObjectType(
  context: RuleContext,
  node: VAST.ESLintObjectExpression
): VueObjectType | null {
  if (node.type !== 'ObjectExpression' || !node.parent) {
    return null
  }
  const parent = node.parent
  if (parent.type === 'ExportDefaultDeclaration') {
    // export default {} in .vue || .jsx
    const ext = extname(getFilename(context)).toLowerCase()
    if (
      (ext === '.vue' || ext === '.jsx' || !ext) &&
      skipTSAsExpression(parent.declaration) === node
    ) {
      const scriptSetup = getScriptSetupElement(context)
      if (
        scriptSetup &&
        scriptSetup.range[0] <= parent.range[0] &&
        parent.range[1] <= scriptSetup.range[1]
      ) {
        // `export default` in `<script setup>`
        return null
      }
      return 'export'
    }
  } else if (parent.type === 'CallExpression') {
    // Vue.component('xxx', {}) || component('xxx', {})
    if (
      getVueComponentDefinitionType(node) != null &&
      skipTSAsExpression(parent.arguments.slice(-1)[0]) === node
    ) {
      return 'definition'
    }
  } else if (parent.type === 'NewExpression') {
    // new Vue({})
    if (
      isVueInstance(parent) &&
      skipTSAsExpression(parent.arguments[0]) === node
    ) {
      return 'instance'
    }
  } else if (parent.type === 'VariableDeclarator') {
    // This is a judgment method that eslint-plugin-vue does not have.
    // If the variable name is PascalCase, it is considered to be a Vue component. e.g. MyComponent = {}
    if (
      parent.init === node &&
      parent.id.type === 'Identifier' &&
      /^[A-Z][a-zA-Z\d]+/u.test(parent.id.name) &&
      parent.id.name.toUpperCase() !== parent.id.name
    ) {
      return 'variable'
    }
  } else if (parent.type === 'Property') {
    // This is a judgment method that eslint-plugin-vue does not have.
    // If set to components, it is considered to be a Vue component.
    const componentsCandidate = parent.parent as VAST.ESLintObjectExpression
    const pp = componentsCandidate.parent
    if (
      pp &&
      pp.type === 'Property' &&
      pp.value === componentsCandidate &&
      !pp.computed &&
      (pp.key.type === 'Identifier'
        ? pp.key.name
        : pp.key.type === 'Literal'
          ? `${pp.key.value}`
          : '') === 'components'
    ) {
      return 'components-option'
    }
  }
  if (
    getComponentComments(context).some(
      el => el.loc.end.line === node.loc.start.line - 1
    )
  ) {
    return 'mark'
  }
  return null
}

/**
 * Gets the element of `<script setup>`
 * @param context The ESLint rule context object.
 * @returns the element of `<script setup>`
 */
export function getScriptSetupElement(
  context: RuleContext
): VAST.VElement | null {
  const sourceCode = getSourceCode(context)
  const df =
    sourceCode.parserServices.getDocumentFragment &&
    sourceCode.parserServices.getDocumentFragment()
  if (!df) {
    return null
  }
  const scripts = df.children
    .filter(isVElement)
    .filter(e => e.name === 'script')
  if (scripts.length === 2) {
    return scripts.find(e => getAttribute(e, 'setup')) || null
  } else {
    const script = scripts[0]
    if (script && getAttribute(script, 'setup')) {
      return script
    }
  }
  return null
}
/**
 * Checks whether the given node is VElement.
 * @param node
 */
export function isVElement(
  node: VAST.VElement | VAST.VExpressionContainer | VAST.VText
): node is VAST.VElement {
  return node.type === 'VElement'
}
/**
 * Checks whether the given node is `<i18n>`.
 * @param node
 */
export function isI18nBlock(
  node: VAST.VElement | VAST.VExpressionContainer | VAST.VText
): node is VAST.VElement & { name: 'i18n' } {
  return isVElement(node) && node.name === 'i18n'
}

/**
 * Get the static attribute values from a given element.
 * @param element The element to get.
 */
export function getStaticAttributes(element: VAST.VElement): {
  [name: string]: string | undefined
} {
  const attrs: { [name: string]: string | undefined } = {}
  for (const attr of element.startTag.attributes) {
    if (!attr.directive && attr.value) {
      attrs[attr.key.name] = attr.value.value
    }
  }
  return attrs
}

/**
 * Retrieve `TSAsExpression#expression` value if the given node a `TSAsExpression` node. Otherwise, pass through it.
 * @template T Node type
 * @param node The node to address.
 * @returns The `TSAsExpression#expression` value if the node is a `TSAsExpression` node. Otherwise, the node.
 */
export function skipTSAsExpression<T extends VAST.Node>(node: T): T {
  if (!node) {
    return node
  }
  // @ts-expect-error -- ignore
  if (node.type === 'TSAsExpression') {
    // @ts-expect-error -- ignore
    return skipTSAsExpression(node.expression)
  }
  return node
}

export function compositingVisitors(
  visitor: RuleListener,
  ...visitors: RuleListener[]
) {
  for (const v of visitors) {
    for (const key in v) {
      if (visitor[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const o = visitor[key] as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visitor[key] = (...args: any[]) => {
          o(...args)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(v[key] as any)(...args)
        }
      } else {
        visitor[key] = v[key]
      }
    }
  }
  return visitor
}

/**
 * Get the Vue component definition type from given node
 * Vue.component('xxx', {}) || component('xxx', {})
 * @param node Node to check
 * @returns {'component' | 'mixin' | 'extend' | 'createApp' | 'defineComponent' | null}
 */
function getVueComponentDefinitionType(node: VAST.ESLintObjectExpression) {
  const parent = node.parent
  if (parent && parent.type === 'CallExpression') {
    const callee = parent.callee

    if (callee.type === 'MemberExpression') {
      const calleeObject = skipTSAsExpression(callee.object)

      if (calleeObject.type === 'Identifier') {
        const propName =
          !callee.computed &&
          callee.property.type === 'Identifier' &&
          callee.property.name
        if (calleeObject.name === 'Vue') {
          // for Vue.js 2.x
          // Vue.component('xxx', {}) || Vue.mixin({}) || Vue.extend('xxx', {})
          const maybeFullVueComponentForVue2 =
            propName && isObjectArgument(parent)

          return maybeFullVueComponentForVue2 &&
            (propName === 'component' ||
              propName === 'mixin' ||
              propName === 'extend')
            ? propName
            : null
        }

        // for Vue.js 3.x
        // app.component('xxx', {}) || app.mixin({})
        const maybeFullVueComponent = propName && isObjectArgument(parent)

        return maybeFullVueComponent &&
          (propName === 'component' || propName === 'mixin')
          ? propName
          : null
      }
    }

    if (callee.type === 'Identifier') {
      if (callee.name === 'component') {
        // for Vue.js 2.x
        // component('xxx', {})
        const isDestructedVueComponent = isObjectArgument(parent)
        return isDestructedVueComponent ? 'component' : null
      }
      if (callee.name === 'createApp') {
        // for Vue.js 3.x
        // createApp({})
        const isAppVueComponent = isObjectArgument(parent)
        return isAppVueComponent ? 'createApp' : null
      }
      if (callee.name === 'defineComponent') {
        // for Vue.js 3.x
        // defineComponent({})
        const isDestructedVueComponent = isObjectArgument(parent)
        return isDestructedVueComponent ? 'defineComponent' : null
      }
    }
  }

  return null

  function isObjectArgument(node: VAST.ESLintCallExpression) {
    return (
      node.arguments.length > 0 &&
      skipTSAsExpression(node.arguments.slice(-1)[0]).type ===
        'ObjectExpression'
    )
  }
}

/**
 * Check whether given node is new Vue instance
 * new Vue({})
 * @param node Node to check
 */
function isVueInstance(node: VAST.ESLintNewExpression) {
  const callee = node.callee
  return Boolean(
    node.type === 'NewExpression' &&
      callee.type === 'Identifier' &&
      callee.name === 'Vue' &&
      node.arguments.length &&
      skipTSAsExpression(node.arguments[0]).type === 'ObjectExpression'
  )
}

const componentComments = new WeakMap<RuleContext, VAST.Token[]>()
/**
 * Gets the component comments of a given context.
 * @param context The ESLint rule context object.
 * @return The the component comments.
 */
function getComponentComments(context: RuleContext) {
  let tokens = componentComments.get(context)
  if (tokens) {
    return tokens
  }
  const sourceCode = getSourceCode(context)
  tokens = sourceCode
    .getAllComments()
    .filter(comment => /@vue\/component/g.test(comment.value))
  componentComments.set(context, tokens)
  return tokens
}
