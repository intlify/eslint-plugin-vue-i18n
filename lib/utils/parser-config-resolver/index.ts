import { shouldUseFlatConfig } from './should-use-flat-config'
import type { AST as VAST } from 'vue-eslint-parser'
import { buildParserUsingLegacyConfig } from './build-parser-using-legacy-config'
import { buildParserUsingFlatConfig } from './build-parser-using-flat-config'

export type ParseResult = Pick<
  VAST.ESLintExtendedProgram,
  'ast' | 'visitorKeys'
> | null
export type Parser = (filePath: string) => ParseResult

const parsers: Record<string, undefined | Parser> = {}

export function buildParserFromConfig(cwd: string): Parser {
  const parser = parsers[cwd]
  if (parser) {
    return parser
  }
  if (shouldUseFlatConfig(cwd)) {
    return (parsers[cwd] = buildParserUsingFlatConfig(cwd))
  }

  return (parsers[cwd] = buildParserUsingLegacyConfig(cwd))
}
