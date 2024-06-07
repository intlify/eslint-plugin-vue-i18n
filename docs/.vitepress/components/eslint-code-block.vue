<template>
  <div class="eslint-code-container">
    <eslint-editor
      ref="editor"
      v-model="code"
      :linter="linter"
      :config="config"
      :style="{ height }"
      class="eslint-code-block"
      :filename="'/path/' + resplvedFilename"
      :language="language"
      dark
      :format="format"
      :fix="fix"
    />
  </div>
</template>

<script>
import EslintEditor from 'vue-eslint-editor'
import { rules } from '../../../'
import { setTimeouts } from '../../../dist/utils/default-timeouts'
import { setFileContents } from '../shim/fs/fake-fs'

setTimeouts({ CACHE_LOADER: -1, MTIME_MS_CHECK: -1 })
export default {
  name: 'ESLintCodeBlock',
  components: { EslintEditor },
  inject: {
    $resourceGroup: {
      from: '$resourceGroup',
      default: null
    }
  },

  props: {
    fix: {
      type: Boolean,
      default: false
    },
    rules: {
      type: Object,
      default() {
        return {}
      }
    },
    filename: {
      type: String,
      default: undefined
    },
    language: {
      type: String,
      default: 'html'
    },
    localeKey: {
      type: String,
      default: 'file'
    },
    messageSyntaxVersion: {
      type: String,
      default: '^9'
    }
  },

  data() {
    return {
      linter: null,
      format: {
        insertSpaces: true,
        tabSize: 2
      },
      code: ''
    }
  },

  computed: {
    isResource() {
      return this.language === 'json' || this.language === 'yaml'
    },
    resplvedFilename() {
      return (
        this.filename ||
        (this.language === 'json'
          ? 'example.json'
          : this.language === 'yaml'
            ? 'example.yaml'
            : this.language === 'javascript'
              ? 'example.js'
              : 'example.vue')
      )
    },
    config() {
      return {
        globals: {
          console: false,
          // ES2015 globals
          ArrayBuffer: false,
          DataView: false,
          Float32Array: false,
          Float64Array: false,
          Int16Array: false,
          Int32Array: false,
          Int8Array: false,
          Map: false,
          Promise: false,
          Proxy: false,
          Reflect: false,
          Set: false,
          Symbol: false,
          Uint16Array: false,
          Uint32Array: false,
          Uint8Array: false,
          Uint8ClampedArray: false,
          WeakMap: false,
          WeakSet: false,
          // ES2017 globals
          Atomics: false,
          SharedArrayBuffer: false
        },
        rules: this.rules,
        parser:
          this.language === 'json'
            ? 'jsonc-eslint-parser'
            : this.language === 'yaml'
              ? 'yaml-eslint-parser'
              : 'vue-eslint-parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true
          }
        },
        settings: {
          'vue-i18n': {
            localeDir: (this.$resourceGroup
              ? this.$resourceGroup
                  .getFiles()
                  .filter(file => /\.(?:json5?|ya?ml)$/i.test(file))
              : this.isResource
                ? [this.resplvedFilename]
                : []
            ).map(pattern => ({ pattern, localeKey: this.localeKey })),
            messageSyntaxVersion: this.messageSyntaxVersion
          }
        }
      }
    },

    height() {
      const lines = this.code.split('\n').length
      return `${Math.max(120, 19 * lines)}px`
    }
  },

  watch: {
    code(newCode) {
      if (this.$resourceGroup) {
        this.$resourceGroup.set(this.resplvedFilename, newCode)
      }
    }
  },

  async mounted() {
    if (this.$resourceGroup) {
      this.$resourceGroup.addEditor(this)
    }
    this.code = `${this.computeCodeFromSlot(this.$slots.default).trim()}\n`
    this.$refs.editor.$watch('monaco', monaco => {
      monaco.languages.register({ id: 'yaml' })
      monaco.languages.setMonarchTokensProvider(
        'yaml',
        require('monaco-editor/esm/vs/basic-languages/yaml/yaml').language
      )
    })
    // Load linter.
    const [{ Linter }, vueESLintParser, jsoncESLintParser, yamlESLintParser] =
      await Promise.all([
        import('eslint'),
        import('espree').then(() => import('vue-eslint-parser')),
        import('espree').then(() => import('jsonc-eslint-parser')),
        import('yaml-eslint-parser')
      ])

    const linter = (this.linter = new Linter({ cwd: '/path' }))

    for (const ruleId of Object.keys(rules)) {
      linter.defineRule(`@intlify/vue-i18n/${ruleId}`, rules[ruleId])
    }
    linter.defineParser('vue-eslint-parser', vueESLintParser)
    linter.defineParser('jsonc-eslint-parser', jsoncESLintParser)
    linter.defineParser('yaml-eslint-parser', yamlESLintParser)

    const verifyHook = this.verifyHook

    const verify = linter.verify
    linter.verify = function (...args) {
      verifyHook()
      return verify.apply(this, args)
    }
    const verifyAndFix = linter.verifyAndFix
    linter.verifyAndFix = function (...args) {
      verifyHook()
      return verifyAndFix.apply(this, args)
    }
  },

  methods: {
    computeCodeFromSlot(nodes) {
      if (!Array.isArray(nodes)) {
        return ''
      }
      return nodes
        .map(node => node.text || this.computeCodeFromSlot(node.children))
        .join('')
    },
    verifyHook() {
      setFileContents(
        this.$resourceGroup ? this.$resourceGroup.getFileContents() : {}
      )
    },
    lint() {
      this.$refs.editor.lint()
    }
  }
}
</script>

<style>
.eslint-code-container {
  border-radius: 6px;
  padding: 1.25rem 0;
  margin: 1em 0;
  background-color: #1e1e1e;
}

.eslint-code-block {
  width: 100%;
}

.eslint-editor-actions {
  bottom: -0.9rem;
}
</style>
