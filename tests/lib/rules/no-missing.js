'use strict'

const RuleTester = require('eslint').RuleTester

const tester = new RuleTester()

tester.run('no-missing', require('../../lib/rules/no-missing'), {
  valid: [
  ],
  invalid: [
  ]
})
