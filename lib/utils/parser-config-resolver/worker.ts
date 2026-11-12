import { runAsWorker } from 'synckit'
import { getESLint } from 'eslint-compat-utils/eslint'
import type { Linter } from 'eslint'
import type { ParseResult } from '.'
import { CacheLoader } from '../cache-loader'
import { parseByParser } from './parse-by-parser'
const ESLint = getESLint()
// A new ESLint instance reloads the config file and rebuilds the config array.
const eslintLoader = new CacheLoader((cwd: string) => new ESLint({ cwd }))

runAsWorker(async (cwd: string, filePath: string): Promise<ParseResult> => {
  const eslint = eslintLoader.get(cwd)
  const config: Linter.FlatConfig =
    await eslint.calculateConfigForFile(filePath)
  const languageOptions = config.languageOptions || {}
  const parserOptions = Object.assign(
    {
      sourceType: languageOptions.sourceType || 'module',
      ecmaVersion: languageOptions.ecmaVersion || 'latest'
    },
    languageOptions.parserOptions,
    {
      loc: true,
      range: true,
      raw: true,
      tokens: true,
      comment: true,
      eslintVisitorKeys: true,
      eslintScopeManager: true,
      filePath
    }
  )

  const result = parseByParser(
    filePath,
    languageOptions.parser as Linter.Parser | string | undefined,
    parserOptions
  )
  if (!result) {
    return null
  }

  return {
    ast: result.ast,
    visitorKeys: result?.visitorKeys
  }
})
