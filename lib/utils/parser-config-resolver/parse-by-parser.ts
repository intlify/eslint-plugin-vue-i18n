import type { Linter } from 'eslint'
import { readFileSync } from 'fs'
import path from 'path'
import { parseForESLint } from 'vue-eslint-parser'
import type { ParseResult } from '.'

export function parseByParser(
  filePath: string,
  parserDefine: Linter.ParserModule | string | undefined,
  parserOptions: unknown
): ParseResult {
  const parser = getParser(parserDefine, filePath)
  try {
    const text = readFileSync(path.resolve(filePath), 'utf8')
    const parseResult =
      'parseForESLint' in parser && typeof parser.parseForESLint === 'function'
        ? parser.parseForESLint(text, parserOptions)
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { ast: (parser as any).parse(text, parserOptions) }
    return parseResult as ParseResult
  } catch (_e) {
    return null
  }
}

function getParser(
  parser: Linter.ParserModule | string | undefined,
  filePath: string
): Linter.ParserModule {
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
    return { parseForESLint } as Linter.ParserModule
  }
  return require('espree')
}
