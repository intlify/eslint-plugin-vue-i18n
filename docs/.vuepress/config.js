'use strict'

const { withCategories } = require('../../scripts/lib/rules')
require('../../scripts/update-docs-headers')
require('../../scripts/update-docs-index')

module.exports = {
  base: '/eslint-plugin-vue-i18n/',
  title: 'eslint-plugin-vue-i18n',
  description: 'ESLint plugin for Vue I18n',
  serviceWorker: false,
  evergreen: true,
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }]
  ],
  themeConfig: {
    repo: 'kazupon/eslint-plugin-vue-i18n',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    search: false,
    nav: [{
      text: 'Patreon',
      link: 'https://www.patreon.com/kazupon'
    }, {
      text: 'Release Notes',
      link: 'https://github.com/kazupon/eslint-plugin-vue-i18n/releases'
    }],
    sidebarDepth: 0,
    sidebar: {
      '/': [
        '/',
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
