/**
 * @fileoverview Update recommended rules
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update-recommended-rules.js
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import rules from './lib/rules'
import { format } from './lib/utils'

main()

async function main() {
  // recommended.ts
  writeFileSync(
    resolve(__dirname, '../lib/configs/recommended.ts'),
    await format(
      `/** DON'T EDIT THIS FILE; was created by scripts. */
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
}`,
      resolve(__dirname, '../lib/configs/recommended.ts')
    )
  )
}
