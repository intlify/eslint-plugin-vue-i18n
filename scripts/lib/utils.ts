import fs from 'node:fs/promises'
import { join } from 'path'
import { load } from 'js-yaml'
import { ESLint } from '../lib/eslint-compat'
import { type Options, format } from 'prettier'
const eslint = new ESLint({ fix: true })

async function lint(text: string, filename: string): Promise<string> {
  const lintResults = await eslint.lintText(text, { filePath: filename })
  return lintResults.length > 0 ? lintResults[0].output || text : text
}

function camelCase(str: string) {
  return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ''))
}

async function writeFile(filePath: string, content: string) {
  const linted = await lint(content, filePath)
  const prettierrc = load(
    await fs.readFile(join(__dirname, '../../.prettierrc.yaml'), 'utf-8')
  ) as Options
  await fs.writeFile(
    filePath,
    await format(linted, { filepath: filePath, ...prettierrc })
  )
}

export { writeFile, camelCase }
