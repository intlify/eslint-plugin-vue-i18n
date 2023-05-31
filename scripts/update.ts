/**
 * @fileoverview Update script
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/update.js
 */
import { writeFileSync } from 'fs'
import { resolve } from 'node:path'
import { createIndex } from './lib/utils'

// docs.
import { updateRuleDocs } from './update-rule-docs'
updateRuleDocs()
import './update-docs-index'

// recommended rules.
import './update-recommended-rules'

main()

async function main() {
  // indices.
  for (const pairs of [
    [resolve(__dirname, '../lib/configs')],
    [resolve(__dirname, '../lib/rules')],
    [resolve(__dirname, '../lib/utils'), '', true]
  ] as const) {
    const [dirPath, prefix, all] = pairs
    writeFileSync(`${dirPath}.ts`, await createIndex(dirPath, prefix, all))
  }
}
