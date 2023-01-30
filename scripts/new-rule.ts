import path from 'path'
import fs from 'fs'
import cp from 'child_process'
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

  const ruleFile = path.resolve(__dirname, `../lib/rules/${ruleId}.ts`)
  const testFile = path.resolve(__dirname, `../tests/lib/rules/${ruleId}.ts`)
  const docFile = path.resolve(__dirname, `../docs/rules/${ruleId}.md`)

  fs.writeFileSync(
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
  fs.writeFileSync(
    testFile,
    `import { RuleTester } from 'eslint'
import rule = require('../../../lib/rules/${ruleId}')
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
  fs.writeFileSync(
    docFile,
    `---
title: 'vue-i18n-ex/${ruleId}'
description: description
---

# vue-i18n-ex/${ruleId}

> description

## :book: Rule Details

This rule reports ???.

<eslint-code-block>

<!-- eslint-skip -->

\`\`\`vue
<script>
/* eslint vue-i18n-ex/${ruleId}: "error" */
</script>

<!-- ✓ GOOD -->


<!-- ✗ BAD -->

\`\`\`

</eslint-code-block>

## :gear: Options

\`\`\`json
{
  "vue-i18n-ex/${ruleId}": ["error", {

  }]
}
\`\`\`

-

`
  )

  cp.execSync(`code "${ruleFile}"`)
  cp.execSync(`code "${testFile}"`)
  cp.execSync(`code "${docFile}"`)
})(process.argv[2])
