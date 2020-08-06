/**
 * @fileoverview VuePress configration
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

require('ts-node').register()
const { withCategories } = require('../../scripts/lib/rules')
require('../../scripts/update-docs-headers')
require('../../scripts/update-docs-index')

module.exports = {
  base: '/',
  title: 'eslint-plugin-vue-i18n',
  description: 'ESLint plugin for Vue I18n',
  serviceWorker: true,
  evergreen: true,
  head: [['meta', { name: 'theme-color', content: '#3eaf7c' }]],
  themeConfig: {
    repo: 'intlify/eslint-plugin-vue-i18n',
    docsRepo: 'intlify/eslint-plugin-vue-i18n',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    search: false,
    lastUpdated: true,
    serviceWorker: {
      updatePopup: true
    },
    nav: [
      {
        text: 'Support Intlify',
        items: [
          {
            text: 'GitHub Sponsors',
            link: 'https://github.com/sponsors/kazupon'
          },
          {
            text: 'Patreon',
            link: 'https://www.patreon.com/kazupon'
          }
        ]
      },
      {
        text: 'Release Notes',
        link: 'https://github.com/intlify/eslint-plugin-vue-i18n/releases'
      }
    ],
    sidebar: {
      '/': [
        '/',
        '/started',
        '/rules/',
        ...withCategories.map(({ category, rules }) => ({
          title: `Rules in ${category}`,
          collapsable: false,
          children: rules.map(rule => `/rules/${rule.name}`)
        }))
      ]
    }
  }
}
