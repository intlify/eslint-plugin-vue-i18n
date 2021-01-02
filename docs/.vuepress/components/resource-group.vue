<template>
  <div>
    <slot />
  </div>
</template>

<script>
import Vue from 'vue'
export default {
  provide() {
    const data = Vue.observable({ fileContents: {} })
    return {
      $resourceGroup: {
        set(fileName, code) {
          Vue.set(data.fileContents, fileName, code)
        },
        getFileContents() {
          return data.fileContents
        },
        getFiles() {
          return Object.keys(data.fileContents)
        }
      }
    }
  }
}
</script>
