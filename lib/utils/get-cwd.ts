import type { RuleContext } from '../types'

export function getCwd(context: RuleContext): string {
  return (
    context.settings?.['vue-i18n']?.cwd ?? context.getCwd?.() ?? process.cwd()
  )
}
