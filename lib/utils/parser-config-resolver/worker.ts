// @ts-expect-error -- ignore
import { runAsWorker } from 'synckit'
import { getESLint } from 'eslint-compat-utils/eslint'
import type { Linter } from 'eslint'
import type { ParseResult } from '.'
import { parseByParser } from './parse-by-parser'
const ESLint = getESLint()

runAsWorker(async (cwd: string, filePath: string): Promise<ParseResult> => {
  const eslint = new ESLint({ cwd })
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

  const result = parseByParser(filePath, languageOptions.parser, parserOptions)
  if (!result) {
    return null
  }

  return {
    ast: result.ast,
    visitorKeys: result?.visitorKeys
  }
})
