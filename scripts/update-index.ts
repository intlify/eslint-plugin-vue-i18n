import path from 'node:path'
import { getFiles, camelCase, writeFile } from './lib/utils'

async function createIndex(dirPath: string): Promise<string> {
  const dirName = path.basename(dirPath)
  const tsFiles = await getFiles(dirPath)
  return `/** DON'T EDIT THIS FILE; was created by scripts. */
${tsFiles
  .map(id => `import ${camelCase(id)} from './${dirName}/${id}';`)
  .join('\n')}

export = {
  ${tsFiles.map(id => `'${id}': ${camelCase(id)},`).join('\n    ')}
}`
}

export async function update() {
  for (const dirPath of [
    path.resolve(__dirname, '../lib/configs'),
    path.resolve(__dirname, '../lib/rules')
  ] as const) {
    const content = await createIndex(dirPath)
    await writeFile(`${dirPath}.ts`, content)
  }
}
