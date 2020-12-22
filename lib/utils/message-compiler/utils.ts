import type { RuleContext } from '../../types'
import semver from 'semver'

export type MessageSyntaxVersions = { v8: boolean; v9: boolean }

export function getMessageSyntaxVersions(
  context: RuleContext
): MessageSyntaxVersions {
  return {
    v8: intersectsMessageSyntaxVersion(context, '^8.0.0'),
    v9: intersectsMessageSyntaxVersion(context, '>=9.0.0-0')
  }
}
export function intersectsMessageSyntaxVersion(
  context: RuleContext,
  version: string
): boolean {
  const { settings } = context
  const messageSyntaxVersion =
    settings['vue-i18n'] && settings['vue-i18n'].messageSyntaxVersion

  if (!messageSyntaxVersion) {
    return true
  }
  return semver.intersects(messageSyntaxVersion, version)
}
