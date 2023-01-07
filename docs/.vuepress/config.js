/**
 * @fileoverview VuePress configuration
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

require('ts-node').register()
const path = require('path')
const { withCategories } = require('../../scripts/lib/rules')
require('../../scripts/update-rule-docs')
require('../../scripts/update-docs-index')

module.exports = {
  configureWebpack(_config, _isServer) {
    return {
      resolve: {
        alias: {
          module: require.resolve('./shim/module'),
          glob: require.resolve('./shim/glob'),
          eslint$: path.resolve(__dirname, './shim/eslint'),
          '@eslint/eslintrc/universal': path.resolve(
            __dirname,
            '../../node_modules/@eslint/eslintrc/dist/eslintrc-universal.cjs'
          ),
          '@eslint/eslintrc$': path.resolve(
            __dirname,
            './shim/@eslint/eslintrc'
          ),
          'eslint-visitor-keys$': path.resolve(
            __dirname,
            './shim/eslint-visitor-keys'
          ),
          esquery$: require.resolve('esquery/dist/esquery'),
          fs: require.resolve('./shim/fs'),
          [path.resolve(__dirname, '../../dist/utils/glob-utils')]:
            require.resolve('./shim/eslint-plugin-vue-i18n/utils/glob-utils')
        }
      }
    }
  },
  chainWebpack(config) {
    // Transpile because some dependency modules can't be parsed by webpack.
    const jsRule = config.module.rule('js')
    const baseExcludes = jsRule.exclude.values()
    jsRule.exclude.clear()
    jsRule.exclude.add(filePath => {
      if (/\/node_modules\/(?:yaml|parse5)\//u.test(filePath)) {
        return false
      }
      return baseExcludes.some(exclude => exclude(filePath))
    })
  },
  base: '/',
  title: 'eslint-plugin-vue-i18n',
  description: 'ESLint plugin for Vue I18n',
  serviceWorker: true,
  evergreen: false,
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
