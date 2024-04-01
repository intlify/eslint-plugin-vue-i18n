import path from 'node:path'
import { disableRules } from './lib/rules'
import { writeFile } from './lib/utils'

export async function update() {
  // base.ts
  const raw = `/** DON'T EDIT THIS FILE; was created by scripts. */
export = [
  {
    name: "@intlify/vue-i18n:base:setup",
    plugins: {
      get "@intlify/vue-i18n"() {
        return require('../../index')
      }
    }
  },
  {
    name: "@intlify/vue-i18n:base:setup:json",
    files: ['*.json', '**/*.json', '*.json5', '**/*.json5'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: require('jsonc-eslint-parser')
      }
    }
  },
  {
    name: "@intlify/vue-i18n:base:setup:yaml",
    files: ['*.yaml', '**/*.yaml', '*.yml', '**/*.yml'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: require('yaml-eslint-parser')
      }
    },
    rules: ${JSON.stringify(disableRules, null, 2)}
  }
]`

  await writeFile(path.resolve(__dirname, '../lib/configs/flat/base.ts'), raw)
}
