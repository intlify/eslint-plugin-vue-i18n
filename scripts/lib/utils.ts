/**
 * @fileoverview Utility script library
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/lib/utils.js
 */
import { readdirSync, existsSync } from 'fs'
import { basename, extname, join } from 'path'
import { CLIEngine } from 'eslint'
const linter = new CLIEngine({ fix: true })

function format(text: string, filename: string): string {
  const lintResult = linter.executeOnText(text, filename)
  return lintResult.results[0].output || text
}

/**
 * Convert text to camelCase
 */
function camelCase(str: string) {
  return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ''))
}

function createIndex(dirPath: string, prefix = '', all = false): string {
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
