import path from 'node:path'
import { getRules } from './lib/rules'
import { writeFile } from './lib/utils'

export async function update() {
  const rules = await getRules()

  // recommended.ts
  const raw = `/** DON'T EDIT THIS FILE; was created by scripts. */
const globals = require('globals')
const config = require('./base')
export = [
  ...config,
  {
    name: "vue-i18n-ex:recommended:setup",
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
      },
    },
  },
  {
    name: "vue-i18n-ex:recommended:rules",
    rules: {
      ${rules
        .filter(rule => rule.recommended)
        .map(rule => `'${rule.id}': 'warn',`)
        .join('\n')}
    },
  },
]`

  await writeFile(
    path.resolve(__dirname, '../lib/configs/flat/recommended.ts'),
    raw
  )
}
