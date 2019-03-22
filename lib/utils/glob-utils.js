/**
 * @fileoverview Utilities for working with globs and the filesystem.
 * Borrow from GitHub `eslint/eslint` repo
 * @see https://github.com/eslint/eslint/blob/master/lib/util/glob-utils.js
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const lodash = require('lodash')
const { existsSync, statSync, realpathSync } = require('fs')
const { resolve } = require('path')
const GlobSync = require('./glob-sync')
const { convertPathToPosix } = require('./path-utils')
const IgnoredPaths = require('./ignored-paths')
const debug = require('debug')('eslint-plugin-vue-i18n:glob-utils')

/**
 * Checks whether a directory exists at the given location
 */
function directoryExists (resolvedPath) {
  return existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()
}

/**
 * Checks if a provided path is a directory and returns a glob string matching
 * all files under that directory if so, the path itself otherwise.
 *
 * Reason for this is that `glob` needs `/**` to collect all the files under a
 * directory where as our previous implementation without `glob` simply walked
 * a directory that is passed. So this is to maintain backwards compatibility.
 *
 * Also makes sure all path separators are POSIX style for `glob` compatibility.
 */
function processPath (options) {
  const cwd = (options && options.cwd) || process.cwd()
  let extensions = (options && options.extensions) || ['.js']

  extensions = extensions.map(ext => ext.replace(/^\./, ''))

  let suffix = '/**'

  if (extensions.length === 1) {
    suffix += `/*.${extensions[0]}`
  } else {
    suffix += `/*.{${extensions.join(',')}}`
  }

  /**
   * A function that converts a directory name to a glob pattern
   */
  return function (pathname) {
    let newPath = pathname
    const resolvedPath = resolve(cwd, pathname)

    if (directoryExists(resolvedPath)) {
      newPath = pathname.replace(/[/\\]$/, '') + suffix
    }

    return convertPathToPosix(newPath)
  }
}

/**
 * The error type when no files match a glob.
 */
class NoFilesFoundError extends Error {
  constructor (pattern) {
    super(`No files matching '${pattern}' were found.`)

    this.messageTemplate = 'file-not-found'
    this.messageData = { pattern }
  }
}

/**
 * The error type when there are files matched by a glob, but all of them have been ignored.
 */
class AllFilesIgnoredError extends Error {
  constructor (pattern) {
    super(`All files matched by '${pattern}' are ignored.`)
    this.messageTemplate = 'all-files-ignored'
    this.messageData = { pattern }
  }
}

const NORMAL_LINT = {}
const SILENTLY_IGNORE = {}
const IGNORE_AND_WARN = {}

/**
 * Tests whether a file should be linted or ignored
 */
function testFileAgainstIgnorePatterns (filename, options, isDirectPath, ignoredPaths) {
  const shouldProcessCustomIgnores = options.ignore !== false
  const shouldLintIgnoredDirectPaths = options.ignore === false
  const fileMatchesIgnorePatterns =
    ignoredPaths.contains(filename, 'default') ||
    (shouldProcessCustomIgnores && ignoredPaths.contains(filename, 'custom'))

  if (fileMatchesIgnorePatterns && isDirectPath && !shouldLintIgnoredDirectPaths) {
    return IGNORE_AND_WARN
  }

  if (!fileMatchesIgnorePatterns || (isDirectPath && shouldLintIgnoredDirectPaths)) {
    return NORMAL_LINT
  }

  return SILENTLY_IGNORE
}

/**
 * Resolves any directory patterns into glob-based patterns for easier handling.
 */
function resolveFileGlobPatterns (patterns, options) {
  if (options.globInputPaths === false) { return patterns }
  const processPathExtensions = processPath(options)
  return patterns.map(processPathExtensions)
}

const dotfilesPattern = /(?:(?:^\.)|(?:[/\\]\.))[^/\\.].*/

/**
 * Build a list of absolute filesnames on which ESLint will act.
 * Ignored files are excluded from the results, as are duplicates.
 */
function listFilesToProcess (globPatterns, providedOptions) {
  const options = providedOptions || { ignore: true }
  const cwd = options.cwd || process.cwd()

  const getIgnorePaths = optionsObj => new IgnoredPaths(optionsObj)

  /*
   * The test "should use default options if none are provided" (source-code-utils.js) checks that 'module.exports.resolveFileGlobPatterns' was called.
   * So it cannot use the local function "resolveFileGlobPatterns".
   */
  const resolvedGlobPatterns = module.exports.resolveFileGlobPatterns(globPatterns, options)

  debug('Creating list of files to process.')
  const resolvedPathsByGlobPattern = resolvedGlobPatterns.map(pattern => {
    const file = resolve(cwd, pattern)

    if (options.globInputPaths === false ||
       (existsSync(file) && statSync(file).isFile())) {
      const ignoredPaths = getIgnorePaths(options)
      const fullPath = options.globInputPaths === false
        ? file
        : realpathSync(file)

      return [{
        filename: fullPath,
        behavior: testFileAgainstIgnorePatterns(
          fullPath, options, true, ignoredPaths
        )
      }]
    }

    // regex to find .hidden or /.hidden patterns, but not ./relative or ../relative
    const globIncludesDotfiles = dotfilesPattern.test(pattern)
    let newOptions = options

    if (!options.dotfiles) {
      newOptions = Object.assign({}, options, { dotfiles: globIncludesDotfiles })
    }

    const ignoredPaths = getIgnorePaths(newOptions)
    const shouldIgnore = ignoredPaths.getIgnoredFoldersGlobChecker()
    const globOptions = { nodir: true, dot: true, cwd }

    return new GlobSync(pattern, globOptions, shouldIgnore).found.map(globMatch => {
      const relativePath = resolve(cwd, globMatch)
      return {
        filename: relativePath,
        behavior: testFileAgainstIgnorePatterns(
          relativePath, options, false, ignoredPaths
        )
      }
    })
  })

  const allPathDescriptors = resolvedPathsByGlobPattern.reduce((pathsForAllGlobs, pathsForCurrentGlob, index) => {
    if (pathsForCurrentGlob.every(pathDescriptor => pathDescriptor.behavior === SILENTLY_IGNORE)) {
      throw new (pathsForCurrentGlob.length
        ? AllFilesIgnoredError
        : NoFilesFoundError)(globPatterns[index])
    }

    pathsForCurrentGlob.forEach(pathDescriptor => {
      switch (pathDescriptor.behavior) {
        case NORMAL_LINT:
          pathsForAllGlobs.push({
            filename: pathDescriptor.filename,
            ignored: false
          })
          break
        case IGNORE_AND_WARN:
          pathsForAllGlobs.push({
            filename: pathDescriptor.filename,
            ignored: true
          })
          break
        case SILENTLY_IGNORE:
          // do nothing
          break

        default:
          throw new Error(`Unexpected file behavior for ${pathDescriptor.filename}`)
      }
    })

    return pathsForAllGlobs
  }, [])

  const ret = lodash.uniqBy(
    allPathDescriptors,
    pathDescriptor => pathDescriptor.filename
  )
  debug(ret)
  return ret
}

module.exports = {
  resolveFileGlobPatterns,
  listFilesToProcess
}
