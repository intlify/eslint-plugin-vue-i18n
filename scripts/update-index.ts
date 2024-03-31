import path from 'node:path'
import { getRuleNames } from './lib/rules'
import { PRESETS } from './lib/configs'
import { camelCase, writeFile } from './lib/utils'

export async function update() {
  const ruleNames = await getRuleNames()

  const raw = `/** DON'T EDIT THIS FILE; was created by scripts. */
// configs
${PRESETS.map(
  preset => `import ${camelCase(preset)} from './configs/${preset}';`
).join('\n')}
${PRESETS.map(
  preset =>
    `import ${camelCase(`flat-${preset}`)} from './configs/flat/${preset}';`
).join('\n')}

// rules
${ruleNames
  .map(ruleName => `import ${camelCase(ruleName)} from './rules/${ruleName}';`)
  .join('\n')}

// export plugin
export = {
  configs: {
    // eslintrc configs
    ${PRESETS.map(preset => `'${preset}': ${camelCase(preset)},`).join('\n')}

    // flat configs
    ${PRESETS.map(
      preset => `'flat/${preset}': ${camelCase(`flat-${preset}`)},`
    ).join('\n')}
  },
  rules: {
    ${ruleNames
      .map(ruleName => `'${ruleName}': ${camelCase(ruleName)},`)
      .join('\n')}
  }
}
`

  await writeFile(path.resolve(__dirname, '../lib/index.ts'), raw)
}
