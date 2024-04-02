import path from 'node:path'
import { getRules } from './lib/rules'
import { writeFile } from './lib/utils'

export async function update() {
  const rules = await getRules()
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
      .join('\n')}
  },
}`

  await writeFile(path.resolve(__dirname, '../lib/configs/recommended.ts'), raw)
}
