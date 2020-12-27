import type { RuleContext } from '../../types'
import semver from 'semver'

export type MessageSyntaxVersions = {
  v8: boolean
  v9: boolean
  isNotSet: boolean
}

export function getMessageSyntaxVersions(
  context: RuleContext
): MessageSyntaxVersions {
  const { settings } = context
  const messageSyntaxVersion =
    settings['vue-i18n'] && settings['vue-i18n'].messageSyntaxVersion

  if (!messageSyntaxVersion) {
    return { v8: true, v9: true, isNotSet: true }
  }
  const range = new semver.Range(messageSyntaxVersion)
  return {
    v8: semver.intersects(range, '^8.0.0 || <=8.0.0'),
    v9: semver.intersects(range, '>=9.0.0-0'),
    isNotSet: false
  }
}
