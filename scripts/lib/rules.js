/**
 * @fileoverview Rules loading script library
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * Forked by https://github.com/mysticatea/eslint-plugin-eslint-comments/tree/master/scripts/lib/rules.js
 */
'use strict'

const { readdirSync } = require('fs')
const { resolve, basename } = require('path')

const rules = readdirSync(resolve(__dirname, '../../lib/rules'))
  .map(fileName => basename(fileName, '.js'))
  .map(name => {
    const meta = require(`../../lib/rules/${name}`).meta
    return {
      id: `@intlify/vue-i18n/${name}`,
      name,
      category: String(meta.docs.category),
      description: String(meta.docs.description),
      recommended: Boolean(meta.docs.recommended),
      fixable: Boolean(meta.fixable),
      deprecated: Boolean(meta.deprecated),
      replacedBy: meta.docs.replacedBy || null
    }
  })

module.exports = rules
module.exports.withCategories = [
  'Recommended',
  'Best Practices'
  /*
  'Stylistic Issues'
  */
].map(category => ({
  category,
  rules: rules.filter(rule => rule.category === category && !rule.deprecated)
}))
