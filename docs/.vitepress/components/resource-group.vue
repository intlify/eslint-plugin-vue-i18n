<template>
  <div>
    <slot />
  </div>
</template>

<script>
export default {
  provide() {
    let waitSeq = 0
    const data = Vue.observable({ fileContents: {} })
    const editors = new Set()
    return {
      $resourceGroup: {
        async set(fileName, code) {
          data.fileContents[`/path/${fileName}`] = code

          const timeSeq = ++waitSeq
          await Vue.nextTick()
          if (timeSeq !== waitSeq) {
            return
          }

          for (const editor of editors) {
            editor.lint()
          }
        },
        getFileContents() {
          return data.fileContents
        },
        getFiles() {
          return Object.keys(data.fileContents)
        },
        addEditor(editor) {
          editors.add(editor)
        }
      }
    }
  }
}
</script>
