import fs from 'node:fs'
import path from 'node:path'

export function readPackageJson(base: string) {
  return JSON.parse(
    fs.readFileSync(path.resolve(base, 'package.json'), 'utf-8')
  )
}
