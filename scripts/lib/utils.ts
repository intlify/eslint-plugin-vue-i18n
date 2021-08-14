/**
 * @fileoverview Utility script library
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/lib/utils.js
 */
import { readdirSync, existsSync } from 'fs'
import { basename, extname, join } from 'path'
import { ESLint } from '../lib/eslint-compat'
const eslint = new ESLint({ fix: true })

async function format(text: string, filename: string): Promise<string> {
  const lintResults = await eslint.lintText(text, { filePath: filename })
  return lintResults[0].output || text
}

/**
 * Convert text to camelCase
 */
function camelCase(str: string) {
  return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ''))
}

async function createIndex(
  dirPath: string,
  prefix = '',
  all = false
): Promise<string> {
  const dirName = basename(dirPath)
  const tsFiles = readdirSync(dirPath)
    .filter(
      file =>
        file.endsWith('.ts') || existsSync(join(dirPath, file, 'index.ts'))
    )
    .map(file => basename(file, extname(file)))
  return format(
    `/** DON'T EDIT THIS FILE; was created by scripts. */
${tsFiles
  .map(
    id =>
      `import ${all ? '* as ' : ''}${camelCase(id)} from './${dirName}/${id}';`
  )
  .join('\n')}

export = {
    ${tsFiles.map(id => `'${prefix}${id}': ${camelCase(id)},`).join('\n    ')}
  }
  `,
    'input.ts'
  )
}

export { createIndex, format }
