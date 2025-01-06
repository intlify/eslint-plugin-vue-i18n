import type { Parser } from '.'
// @ts-expect-error -- ignore
import { Legacy } from '@eslint/eslintrc'
import path from 'path'
import { parseByParser } from './parse-by-parser'
const { CascadingConfigArrayFactory } = Legacy

/**
 * Build parser using legacy config
 */
export function buildParserUsingLegacyConfig(cwd: string): Parser {
  const configArrayFactory = new CascadingConfigArrayFactory({
    additionalPluginPool: new Map([
      ['@intlify/vue-i18n', require('../../index')]
    ]),
    cwd,
    getEslintRecommendedConfig() {
      return {}
    },
    getEslintAllConfig() {
      return {}
    }
  })

  function getConfigForFile(filePath: string) {
    const absolutePath = path.resolve(cwd, filePath)
    return configArrayFactory
      .getConfigArrayForFile(absolutePath)
      .extractConfig(absolutePath)
      .toCompatibleObjectAsConfigFileContent()
  }

  return (filePath: string) => {
    const config = getConfigForFile(filePath)

    const parserOptions = Object.assign({}, config.parserOptions, {
      loc: true,
      range: true,
      raw: true,
      tokens: true,
      comment: true,
      eslintVisitorKeys: true,
      eslintScopeManager: true,
      filePath
    })
    return parseByParser(filePath, config.parser, parserOptions)
  }
}
