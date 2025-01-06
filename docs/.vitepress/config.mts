import { defineConfig } from 'vitepress'
import { getRulesWithCategories } from '../../scripts/lib/rules'
import '../../scripts/update-rule-docs'
import '../../scripts/update-index-docs'

// https://vitepress.dev/reference/site-config
export default async () => {
  const rules = await getRulesWithCategories()
  return defineConfig({
    base: '/',
    title: 'eslint-plugin-vue-i18n',
    description: 'ESLint plugin for Vue I18n',
    head: [['meta', { name: 'theme-color', content: '#3eaf7c' }]],
    lastUpdated: true,
    themeConfig: {
      editLink: {
        pattern:
          'https://github.com/intlify/eslint-plugin-vue-i18n/edit/master/docs/:path',
        text: 'Edit this page on GitHub'
      },
      search: {
        provider: 'local'
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
      sidebar: [
        {
          text: 'Introduction',
          link: '/intro'
        },
        {
          text: 'Getting Started',
          link: '/started'
        },
        {
          text: 'Available Rules',
          link: '/rules/'
        },
        ...rules.map(({ category, rules }) => ({
          text: `Rules in ${category}`,
          collapsed: false,
          items: rules.map(rule => ({
            text: rule.name,
            link: `/rules/${rule.name}`
          }))
        }))
      ],
      socialLinks: [
        {
          icon: 'github',
          link: 'https://github.com/intlify/eslint-plugin-vue-i18n'
        }
      ]
    }
  })
}
