/**
 * @fileoverview Update script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update.js
 */
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { createIndex } from './lib/utils'
import { update as updateRuleDocs } from './update-rule-docs'
import { update as updateDocsIndex } from './update-docs-index'
import { update as updateRecommentedRules } from './update-recommended-rules'

async function main() {
  // update docs.
  await updateRuleDocs()
  await updateDocsIndex()

  // recommended rules.
  await updateRecommentedRules()

  // indices.
  for (const pairs of [
    [resolve(__dirname, '../lib/configs')],
    [resolve(__dirname, '../lib/rules')],
    [resolve(__dirname, '../lib/utils'), '', true]
  ] as const) {
    const [dirPath, prefix, all] = pairs
    const content = await createIndex(dirPath, prefix, all)
    await fs.writeFile(`${dirPath}.ts`, content)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
