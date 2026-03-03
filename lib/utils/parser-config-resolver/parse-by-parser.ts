import type { Linter } from 'eslint'
import { readFileSync } from 'fs'
import path from 'path'
import { parseForESLint } from 'vue-eslint-parser'
import type { ParseResult } from '.'

function stripTypeAwareOptions(
  parserOptions: unknown
): Record<string, unknown> {
  if (
    parserOptions == null ||
    typeof parserOptions !== 'object' ||
    Array.isArray(parserOptions)
  ) {
    return (parserOptions ?? {}) as Record<string, unknown>
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { project, programs, projectService, ...rest } =
    parserOptions as Record<string, unknown>
  if (
    rest.parserOptions != null &&
    typeof rest.parserOptions === 'object' &&
    !Array.isArray(rest.parserOptions)
  ) {
    rest.parserOptions = stripTypeAwareOptions(rest.parserOptions)
  }
  return rest
}

export function parseByParser(
  filePath: string,
  parserDefine: Linter.Parser | string | undefined,
  parserOptions: unknown
): ParseResult {
  const parser = getParser(parserDefine, filePath)
  const safeParserOptions = stripTypeAwareOptions(parserOptions)
  try {
    const text = readFileSync(path.resolve(filePath), 'utf8')
    const parseResult =
      'parseForESLint' in parser && typeof parser.parseForESLint === 'function'
        ? parser.parseForESLint(text, safeParserOptions)
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { ast: (parser as any).parse(text, safeParserOptions) }
    return parseResult as ParseResult
  } catch (_e) {
    return null
  }
}

function getParser(
  parser: Linter.Parser | string | undefined,
  filePath: string
): Linter.Parser {
  if (parser) {
    if (typeof parser === 'string') {
      try {
        return require(parser)
      } catch (_e) {
        // ignore
      }
    } else {
      return parser
    }
  }
  if (filePath.endsWith('.vue')) {
    return { parseForESLint } as Linter.Parser
  }
  return require('espree')
}
