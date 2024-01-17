import { resolve } from 'node:path'
import { writeFileSync } from 'fs'
import { execSync } from 'child_process'
const logger = console

// main
;(ruleId => {
  if (ruleId == null) {
    logger.error('Usage: npm run new <RuleID>')
    process.exitCode = 1
    return
  }
  if (!/^[\w-]+$/u.test(ruleId)) {
    logger.error("Invalid RuleID '%s'.", ruleId)
    process.exitCode = 1
    return
  }

  const ruleFile = resolve(__dirname, `../lib/rules/${ruleId}.ts`)
  const testFile = resolve(__dirname, `../tests/lib/rules/${ruleId}.ts`)
  const docFile = resolve(__dirname, `../docs/rules/${ruleId}.md`)

  writeFileSync(
    ruleFile,
    `import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'

export = createRule({
  meta: {
    type: '...',
    docs: {
      description: '...',
      category: 'Best Practices',
      url: 'https://eslint-plugin-vue-i18n.intlify.dev/rules/${ruleId}.html',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create(context: RuleContext): RuleListener {
    return {}
  }
})
`
  )
  writeFileSync(
    testFile,
    `import { RuleTester } from '../eslint-compat'
import rule from '../../../lib/rules/${ruleId}'

const vueParser = require.resolve('vue-eslint-parser')

const tester = new RuleTester({
    parser: vueParser,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("${ruleId}", rule as never, {
    valid: [
      {
        filename: 'test.vue',
        code: \`
        <i18n>
        </i18n>
        \`,
      },
    ],
    invalid: [
      {
        filename: 'test.vue',
        code: \`
        <i18n>
        </i18n>
        \`,
        errors: [
          {},{},{},
        ],
      },
    ],
})
`
  )
  writeFileSync(
    docFile,
    `---
title: '@intlify/vue-i18n/${ruleId}'
description: description
---

# @intlify/vue-i18n/${ruleId}

> description

## :book: Rule Details

This rule reports ???.

<eslint-code-block>

<!-- eslint-skip -->

\`\`\`vue
<script>
/* eslint @intlify/vue-i18n/${ruleId}: "error" */
</script>

<!-- ✓ GOOD -->


<!-- ✗ BAD -->

\`\`\`

</eslint-code-block>

## :gear: Options

\`\`\`json
{
  "@intlify/vue-i18n/${ruleId}": ["error", {

  }]
}
\`\`\`

-

`
  )

  execSync(`code "${ruleFile}"`)
  execSync(`code "${testFile}"`)
  execSync(`code "${docFile}"`)
})(process.argv[2])
