// @ts-expect-error -- ignore
import { createSyncFn } from 'synckit'
import type { ParseResult, Parser } from '.'

const getSync = createSyncFn(require.resolve('./worker'))

/**
 * Build synchronously parser using the flat config
 */
export function buildParserUsingFlatConfig(cwd: string): Parser {
  return (filePath: string) => {
    return getSync(cwd, filePath) as ParseResult
  }
}
