/**
 * @fileoverview Update recommended rules
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-recommended-rules.js
 */
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import rules from './lib/rules'
import { format as lintWithFix } from './lib/utils'

export async function update() {
  // recommended.ts
  const raw = `/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
  extends: [require.resolve('./base')],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true
  },
  rules: {
    ${rules
      .filter(rule => rule.recommended)
      .map(rule => `'${rule.id}': 'warn',`)
      .join('\n        ')}
  },
}`

  const content = await lintWithFix(
    raw,
    resolve(__dirname, '../lib/configs/recommended.ts')
  )
  await fs.writeFile(
    resolve(__dirname, '../lib/configs/recommended.ts'),
    content
  )
}
