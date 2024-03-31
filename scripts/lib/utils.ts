import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { basename, extname, join } from 'path'
import { ESLint } from '../lib/eslint-compat'
const eslint = new ESLint({ fix: true })

async function format(text: string, filename: string): Promise<string> {
  const lintResults = await eslint.lintText(text, { filePath: filename })
  return lintResults[0].output || text
}

function camelCase(str: string) {
  return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ''))
}

async function getFiles(dirPath: string): Promise<string[]> {
  return (await fs.readdir(dirPath))
    .filter(
      file =>
        file.endsWith('.ts') || existsSync(join(dirPath, file, 'index.ts'))
    )
    .map(file => basename(file, extname(file)))
}

async function writeFile(filePath: string, content: string) {
  const formated = await format(content, filePath)
  await fs.writeFile(filePath, formated)
}

export { writeFile, getFiles, camelCase }
