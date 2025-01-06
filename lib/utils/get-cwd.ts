import type { RuleContext } from '../types'
import { getCwd as getCwdCompat } from 'eslint-compat-utils'

export function getCwd(context: RuleContext): string {
  return (
    context.settings?.['vue-i18n-ex']?.cwd ?? getCwdCompat(context as never)
  )
}
