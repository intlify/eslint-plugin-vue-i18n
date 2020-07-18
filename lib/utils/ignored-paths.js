/**
 * @fileoverview Responsible for loading ignore config files and managing ignore patterns
 * Borrow from GitHub `eslint/eslint` repo
 * @see https://github.com/eslint/eslint/blob/v5.2.0/lib/ignored-paths.js
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */

'use strict'

const { existsSync, statSync, readFileSync } = require('fs')
const { resolve, dirname, relative, sep } = require('path')
const { getRelativePath } = require('./path-utils')
const ignore = require('ignore')
const debug = require('debug')('eslint-plugin-vue-i18n:ignored-paths')

const ESLINT_IGNORE_FILENAME = '.eslintignore'

/**
 * Adds `"*"` at the end of `"node_modules/"`,
 * so that subtle directories could be re-included by .gitignore patterns
 * such as `"!node_modules/should_not_ignored"`
 */
const DEFAULT_IGNORE_DIRS = [
  '/node_modules/*',
  '/bower_components/*'
]
const DEFAULT_OPTIONS = {
  dotfiles: false
}

/**
 * Find a file in the current directory.
 */
function findFile (cwd, name) {
  const ignoreFilePath = resolve(cwd, name)

  return existsSync(ignoreFilePath) && statSync(ignoreFilePath).isFile()
    ? ignoreFilePath
    : ''
}

/**
 * Find an ignore file in the current directory.
 */
function findIgnoreFile (cwd) {
  return findFile(cwd, ESLINT_IGNORE_FILENAME)
}

/**
 * Find an package.json file in the current directory.
 */
function findPackageJSONFile (cwd) {
  return findFile(cwd, 'package.json')
}

/**
 * Merge options with defaults
 */
function mergeDefaultOptions (options) {
  const mergedOptions = Object.assign({}, DEFAULT_OPTIONS, options)
  if (!mergedOptions.cwd) {
    mergedOptions.cwd = process.cwd()
  }
  debug('mergeDefaultOptions: mergedOptions = %j', mergedOptions)
  return mergedOptions
}

/* eslint-disable valid-jsdoc */
/**
 * Normalize the path separators in a given string.
 * On Windows environment, this replaces `\` by `/`.
 * Otherwrise, this does nothing.
 */
const normalizePathSeps = sep === '/'
  ? str => str
  : ((seps, str) => str
    .replace(seps, '/'))
    .bind(null, new RegExp(`\\${sep}`, 'g'))
/* eslint-enable valid-jsdoc */

/**
 * Converts a glob pattern to a new glob pattern relative to a different directory
 */
function relativize (globPattern, relativePathToOldBaseDir) {
  if (relativePathToOldBaseDir === '') { return globPattern }

  const prefix = globPattern.startsWith('!') ? '!' : ''
  const globWithoutPrefix = globPattern.replace(/^!/, '')

  if (globWithoutPrefix.startsWith('/')) {
    return `${prefix}/${normalizePathSeps(relativePathToOldBaseDir)}${globWithoutPrefix}`
  }

  return globPattern
}

/**
 * IgnoredPaths class
 */
class IgnoredPaths {
  constructor (providedOptions) {
    const options = mergeDefaultOptions(providedOptions)

    this.cache = {}

    this.defaultPatterns = [].concat(DEFAULT_IGNORE_DIRS, options.patterns || [])

    this.ignoreFileDir = options.ignore !== false && options.ignorePath
      ? dirname(resolve(options.cwd, options.ignorePath))
      : options.cwd
    this.options = options
    this._baseDir = null

    this.ig = {
      custom: ignore(),
      default: ignore()
    }

    this.defaultPatterns.forEach(pattern => this.addPatternRelativeToCwd(this.ig.default, pattern))
    if (options.dotfiles !== true) {
      /*
       * ignore files beginning with a dot, but not files in a parent or
       * ancestor directory (which in relative format will begin with `../`).
       */
      this.addPatternRelativeToCwd(this.ig.default, '.*')
      this.addPatternRelativeToCwd(this.ig.default, '!../')
    }

    /*
     * Add a way to keep track of ignored files.  This was present in node-ignore
     * 2.x, but dropped for now as of 3.0.10.
     */
    this.ig.custom.ignoreFiles = []
    this.ig.default.ignoreFiles = []

    if (options.ignore !== false) {
      let ignorePath

      if (options.ignorePath) {
        debug('Using specific ignore file')

        try {
          statSync(options.ignorePath)
          ignorePath = options.ignorePath
        } catch (e) {
          e.message = `Cannot read ignore file: ${options.ignorePath}\nError: ${e.message}`
          throw e
        }
      } else {
        debug(`Looking for ignore file in ${options.cwd}`)
        ignorePath = findIgnoreFile(options.cwd)

        try {
          statSync(ignorePath)
          debug(`Loaded ignore file ${ignorePath}`)
        } catch (e) {
          debug('Could not find ignore file in cwd')
        }
      }

      if (ignorePath) {
        debug(`Adding ${ignorePath}`)
        this.addIgnoreFile(this.ig.custom, ignorePath)
        this.addIgnoreFile(this.ig.default, ignorePath)
      } else {
        try {
          // if the ignoreFile does not exist, check package.json for eslintIgnore
          const packageJSONPath = findPackageJSONFile(options.cwd)

          if (packageJSONPath) {
            let packageJSONOptions

            try {
              packageJSONOptions = JSON.parse(readFileSync(packageJSONPath, 'utf8'))
            } catch (e) {
              debug('Could not read package.json file to check eslintIgnore property')
              e.messageTemplate = 'failed-to-read-json'
              e.messageData = {
                path: packageJSONPath,
                message: e.message
              }
              throw e
            }

            if (packageJSONOptions.eslintIgnore) {
              if (Array.isArray(packageJSONOptions.eslintIgnore)) {
                packageJSONOptions.eslintIgnore.forEach(pattern => {
                  this.addPatternRelativeToIgnoreFile(this.ig.custom, pattern)
                  this.addPatternRelativeToIgnoreFile(this.ig.default, pattern)
                })
              } else {
                throw new TypeError('Package.json eslintIgnore property requires an array of paths')
              }
            }
          }
        } catch (e) {
          debug('Could not find package.json to check eslintIgnore property')
          throw e
        }
      }

      if (options.ignorePattern) {
        this.addPatternRelativeToCwd(this.ig.custom, options.ignorePattern)
        this.addPatternRelativeToCwd(this.ig.default, options.ignorePattern)
      }
    }
  }

  /*
   * If `ignoreFileDir` is a subdirectory of `cwd`, all paths will be normalized to be relative to `cwd`.
   * Otherwise, all paths will be normalized to be relative to `ignoreFileDir`.
   * This ensures that the final normalized ignore rule will not contain `..`, which is forbidden in
   * ignore rules.
   */
  addPatternRelativeToCwd (ig, pattern) {
    const baseDir = this.getBaseDir()
    const cookedPattern = baseDir === this.options.cwd
      ? pattern
      : relativize(pattern, relative(baseDir, this.options.cwd))

    ig.addPattern(cookedPattern)
    debug('addPatternRelativeToCwd:\n  original = %j\n  cooked   = %j', pattern, cookedPattern)
  }

  addPatternRelativeToIgnoreFile (ig, pattern) {
    const baseDir = this.getBaseDir()
    const cookedPattern = baseDir === this.ignoreFileDir
      ? pattern
      : relativize(pattern, relative(baseDir, this.ignoreFileDir))

    ig.addPattern(cookedPattern)
    debug('addPatternRelativeToIgnoreFile:\n  original = %j\n  cooked   = %j', pattern, cookedPattern)
  }

  // Detect the common ancestor
  getBaseDir () {
    if (!this._baseDir) {
      const a = resolve(this.options.cwd)
      const b = resolve(this.ignoreFileDir)
      let lastSepPos = 0

      // Set the shorter one (it's the common ancestor if one includes the other).
      this._baseDir = a.length < b.length ? a : b

      // Set the common ancestor.
      for (let i = 0; i < a.length && i < b.length; ++i) {
        if (a[i] !== b[i]) {
          this._baseDir = a.slice(0, lastSepPos)
          break
        }
        if (a[i] === sep) {
          lastSepPos = i
        }
      }

      // If it's only Windows drive letter, it needs \
      if (/^[A-Z]:$/.test(this._baseDir)) {
        this._baseDir += '\\'
      }

      debug('set baseDir = %j', this._baseDir)
    } else {
      debug('alredy set baseDir = %j', this._baseDir)
    }
    return this._baseDir
  }

  /**
   * read ignore filepath
   */
  readIgnoreFile (filePath) {
    if (typeof this.cache[filePath] === 'undefined') {
      this.cache[filePath] = readFileSync(filePath, 'utf8')
        .split(/\r?\n/g)
        .filter(Boolean)
    }
    return this.cache[filePath]
  }

  /**
   * add ignore file to node-ignore instance
   */
  addIgnoreFile (ig, filePath) {
    ig.ignoreFiles.push(filePath)
    this.readIgnoreFile(filePath)
      .forEach(ignoreRule => this.addPatternRelativeToIgnoreFile(ig, ignoreRule))
  }

  /**
   * Determine whether a file path is included in the default or custom ignore patterns
   */
  contains (filepath, category) {
    let result = false
    const absolutePath = resolve(this.options.cwd, filepath)
    const relativePath = getRelativePath(absolutePath, this.getBaseDir())

    if (typeof category === 'undefined') {
      result = (this.ig.default.filter([relativePath]).length === 0) ||
               (this.ig.custom.filter([relativePath]).length === 0)
    } else {
      result = (this.ig[category].filter([relativePath]).length === 0)
    }
    debug('contains:')
    debug('  target = %j', filepath)
    debug('  result = %j', result)

    return result
  }

  /**
   * Returns a list of dir patterns for glob to ignore
   */
  getIgnoredFoldersGlobChecker () {
    const baseDir = this.getBaseDir()
    const ig = ignore()

    DEFAULT_IGNORE_DIRS.forEach(ignoreDir => this.addPatternRelativeToCwd(ig, ignoreDir))

    if (this.options.dotfiles !== true) {
      // Ignore hidden folders.  (This cannot be ".*", or else it's not possible to unignore hidden files)
      ig.add(['.*/*', '!../*'])
    }

    if (this.options.ignore) {
      ig.add(this.ig.custom)
    }

    const filter = ig.createFilter()

    return function (absolutePath) {
      const relative = getRelativePath(absolutePath, baseDir)

      if (!relative) { return false }

      return !filter(relative)
    }
  }
}

module.exports = IgnoredPaths
