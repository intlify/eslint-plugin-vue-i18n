import * as compat from 'eslint-compat-utils'
import type { RuleContext, SourceCode } from '../types'

export function getFilename(context: RuleContext): string {
  return compat.getFilename(context as never)
}
export function getSourceCode(context: RuleContext): SourceCode {
  return compat.getSourceCode(context as never) as never
}
