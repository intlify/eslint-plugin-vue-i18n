import fs from 'fs'
import path from 'path'
import base = require('../../lib/configs/base')

function buildBaseConfigPath() {
  const configPath = path.join(
    __dirname,
    '../../node_modules/@intlify/eslint-plugin-vue-i18n/.temp-test/base-config.json'
  )
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(base, null, 2), 'utf8')
  return configPath
}

export const baseConfigPath = buildBaseConfigPath()
