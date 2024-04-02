import path from 'node:path'
import { disableRules } from './lib/rules'
import { writeFile } from './lib/utils'

export async function update() {
  // base.ts
  const raw = `/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
  parser: require.resolve('vue-eslint-parser'),
  plugins: ['@intlify/vue-i18n'],
  overrides: [
    {
      files: ['*.json', '*.json5'],
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('jsonc-eslint-parser')
      }
    },
    {
      files: ['*.yaml', '*.yml'],
      parser: require.resolve('vue-eslint-parser'),
      parserOptions: {
        parser: require.resolve('yaml-eslint-parser')
      },
      rules: ${JSON.stringify(disableRules, null, 2)}
    }
  ]
}`

  await writeFile(path.resolve(__dirname, '../lib/configs/base.ts'), raw)
}
