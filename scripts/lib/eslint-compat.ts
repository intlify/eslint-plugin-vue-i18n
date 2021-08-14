// @ts-check
import * as eslint from 'eslint'

// eslint-disable-next-line @typescript-eslint/no-namespace -- ignore
export namespace ESLint {
  export type LintResult = eslint.ESLint.LintResult
}
export const ESLint = eslint.ESLint || getESLintClassForV6()

function getESLintClassForV6(): typeof eslint.ESLint {
  class ESLintForV6 {
    private engine: eslint.CLIEngine
    static get version() {
      return eslint.CLIEngine.version
    }

    constructor(options?: eslint.ESLint.Options) {
      const {
        overrideConfig: { plugins, globals, rules, ...overrideConfig } = {
          plugins: [],
          globals: {},
          rules: {}
        },
        fix,
        reportUnusedDisableDirectives,
        plugins: pluginsMap,
        ...otherOptions
      } = options || {}
      const newOptions: eslint.CLIEngine.Options = {
        fix: Boolean(fix),
        reportUnusedDisableDirectives: reportUnusedDisableDirectives
          ? reportUnusedDisableDirectives !== 'off'
          : undefined,
        ...otherOptions,

        globals: globals
          ? Object.keys(globals).filter(n => globals[n])
          : undefined,
        plugins: plugins || [],
        rules: rules
          ? Object.entries(rules).reduce((o, [ruleId, opt]) => {
              if (opt) {
                o[ruleId] = opt
              }
              return o
            }, {} as NonNullable<eslint.CLIEngine.Options['rules']>)
          : undefined,
        ...overrideConfig
      }
      this.engine = new eslint.CLIEngine(newOptions)

      for (const [name, plugin] of Object.entries(pluginsMap || {})) {
        this.engine.addPlugin(name, plugin)
      }
    }

    async lintText(
      ...params: Parameters<eslint.ESLint['lintText']>
    ): ReturnType<eslint.ESLint['lintText']> {
      const result = this.engine.executeOnText(params[0], params[1]?.filePath)
      return result.results
    }
  }

  const eslintClass = ESLintForV6 as never
  return eslintClass
}
