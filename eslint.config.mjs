import pluginVue from 'eslint-plugin-vue'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import markdown from 'eslint-plugin-markdown'
import tseslint from 'typescript-eslint'

export default [
  ...pluginVue.configs['flat/recommended'],
  eslintPluginPrettierRecommended,
  ...markdown.configs.recommended,
  {
    rules: {
      'object-shorthand': 'error',
      'no-debugger': 'error',
      'vue/multi-word-component-names': 'off',
      'prefer-template': 'error',
      'no-restricted-properties': [
        'error',
        {
          object: 'context',
          property: 'getSourceCode',
          message: 'Use lib/utils/compat.ts'
        },
        {
          object: 'context',
          property: 'getFilename',
          message: 'Use lib/utils/compat.ts'
        },
        {
          object: 'context',
          property: 'getPhysicalFilename',
          message: 'Use lib/utils/compat.ts'
        },
        {
          object: 'context',
          property: 'getCwd',
          message: 'Use lib/utils/compat.ts'
        },
        {
          object: 'context',
          property: 'getScope',
          message: 'Use lib/utils/compat.ts'
        },
        {
          object: 'context',
          property: 'parserServices',
          message: 'Use lib/utils/compat.ts'
        }
      ]
    }
  },
  ...tseslint.config({
    files: ['*.ts', '**/*.ts', '*.mts', '**/*.mts'],
    extends: [...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }),
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'vue'].map(ext => [
      `**/*.md/*.${ext}`
    ]),
    rules: {
      'prettier/prettier': 'off',
      'vue/no-v-html': 'off'
    }
  },
  {
    ignores: [
      '!docs/.vitepress/',
      '!.github/',
      '!.vscode/',
      '.nyc_output/',
      'assets/',
      'coverage/',
      'dist/',
      'docs/.vitepress/cache/',
      'docs/.vitepress/dist/',
      'lib/configs/**/*.ts',
      'node_modules/',
      'tests/integrations/'
      // 'tests/fixtures/' // Do not specify it here for the test to work.
    ]
  }
]
