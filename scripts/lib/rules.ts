/**
 * @fileoverview Rules loading script library
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/lib/rules.js
 */
import { readdirSync } from 'fs'
import { dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const __dirname = dirname(fileURLToPath(import.meta.url))

const rules: RuleInfo[] = readdirSync(resolve(__dirname, '../../lib/rules'))
  .map(fileName => basename(fileName, '.ts'))
  .map(async name => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const meta = require(`../../lib/rules/${name}`).meta
    return {
      id: `@intlify/vue-i18n/${name}`,
      name,
      category: String(meta.docs.category),
      description: String(meta.docs.description),
      recommended: Boolean(meta.docs.recommended),
      fixable: Boolean(meta.fixable),
      deprecated: Boolean(meta.deprecated),
      replacedBy: (meta.docs.replacedBy as string[]) || null
    }
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
