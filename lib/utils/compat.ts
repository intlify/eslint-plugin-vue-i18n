import * as compat from 'eslint-compat-utils'
import { RuleContext, SourceCode } from '../types'

export function getFilename(context: RuleContext) {
  return compat.getFilename(context as any)
}
export function getSourceCode(context: RuleContext): SourceCode {
  return compat.getSourceCode(context as any) as any
}
