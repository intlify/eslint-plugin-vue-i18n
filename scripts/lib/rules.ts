/**
 * @fileoverview Rules loading script library
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/lib/rules.js
 */

import rulesImported from '../../lib/rules'

export type RuleInfo = {
  id: string
  name: string
  category: string
  description: string
  recommended: boolean
  fixable: boolean
  deprecated: boolean
  replacedBy: string[] | null
}

const rules = Object.entries(rulesImported).map(rule => {
  const name = rule[0]
  const meta = rule[1].meta
  return {
    id: `@intlify/vue-i18n/${name}`,
    name,
    category: String(meta.docs.category),
    description: String(meta.docs.description),
    recommended: Boolean(meta.docs.recommended),
    fixable: Boolean(meta.fixable),
    deprecated: Boolean(meta.deprecated),
    replacedBy: meta.docs.replacedBy
  } as RuleInfo
})

export default rules
export const withCategories = [
  'Recommended',
  'Best Practices',
  'Stylistic Issues'
].map(category => ({
  category,
  rules: rules.filter(rule => rule.category === category && !rule.deprecated)
}))
