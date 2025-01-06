import path from 'node:path'
import { disableRules } from './lib/rules'
import { writeFile } from './lib/utils'

export async function update() {
  // base.ts
  const raw = `/** DON'T EDIT THIS FILE; was created by scripts. */
export = [
  {
    name: "vue-i18n-ex:base:setup",
    plugins: {
      get "vue-i18n-ex"() {
        return require('../../index')
      }
    }
  },
  {
    name: "vue-i18n-ex:base:setup:json",
    files: ['*.json', '**/*.json', '*.json5', '**/*.json5'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: require('jsonc-eslint-parser')
      }
    }
  },
  {
    name: "vue-i18n-ex:base:setup:yaml",
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
