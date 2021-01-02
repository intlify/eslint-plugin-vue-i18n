import { SourceCode } from '../../../../node_modules/eslint/lib/source-code'
export { SourceCode }
export class CLIEngine {
  addPlugin() {}
  getConfigForFile() {
    return {
      parser: 'vue-eslint-parser',
      parserOptions: {
        sourceType: 'module'
      }
    }
  }
}
