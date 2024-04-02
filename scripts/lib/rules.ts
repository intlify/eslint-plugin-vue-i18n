import fs from 'node:fs'
import path from 'node:path'
import jitiFactory from 'jiti'

export type RuleInfo = {
  id: string
  name: string
  category: string
  description: string
  url: string
  recommended: boolean
  fixable: boolean
  deprecated: boolean
  replacedBy: string[] | null
}

const RULES_DIR = path.resolve(__dirname, '../../lib/rules')

let jiti: ReturnType<typeof jitiFactory> | null = null

function dynamicImport() {
  return jiti ?? (jiti = jitiFactory(__filename))
}

let _rules: RuleInfo[] | null = null

async function getRules() {
  if (_rules) {
    return _rules
  }

  const files = fs
    .readdirSync(RULES_DIR)
    .filter(file => path.extname(file) === '.ts')
    .map(file => path.basename(file, '.ts'))
  _rules = await Promise.all(
    files.map(async name => {
      const rule = dynamicImport()(`${path.join(RULES_DIR, name)}`)
      const meta = { ...rule.meta }
      return {
        id: `@intlify/vue-i18n/${name}`,
        name,
        category: String(meta.docs.category),
        description: String(meta.docs.description),
        url: String(meta.docs.url),
        recommended: Boolean(meta.docs.recommended),
        fixable: Boolean(meta.fixable),
        deprecated: Boolean(meta.deprecated),
        replacedBy: meta.docs.replacedBy
      } satisfies RuleInfo
    })
  )
  return _rules
}

async function getRuleNames() {
  const rules = await getRules()
  return rules.map(rule => rule.name)
}

async function getRulesWithCategories() {
  const rules = await getRules()
  return ['Recommended', 'Best Practices', 'Stylistic Issues'].map(
    category => ({
      category,
      rules: rules.filter(
        rule => rule.category === category && !rule.deprecated
      )
    })
  )
}

const disableRules = {
  // ESLint core rules known to cause problems with YAML.
  // https://github.com/ota-meshi/eslint-plugin-yml/blob/4e468109b9d2f4376b8d4d1221adba27c6ee04b2/src/configs/base.ts#L7-L11
  'no-irregular-whitespace': 'off',
  'spaced-comment': 'off'
}

export { getRules, getRuleNames, getRulesWithCategories, disableRules }
