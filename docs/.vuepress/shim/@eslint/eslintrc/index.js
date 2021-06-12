class CascadingConfigArrayFactory {
  getConfigArrayForFile() {
    return this
  }
  extractConfig() {
    return this
  }
  toCompatibleObjectAsConfigFileContent() {
    return {
      parser: 'vue-eslint-parser',
      parserOptions: {
        sourceType: 'module'
      }
    }
  }
}
export const Legacy = {
  CascadingConfigArrayFactory
}
