<template>
  <div id="app">
    <p v-t="'hello_dio'">{{ $t('messages.hello') }}</p>
  </div>
</template>

<script lang="ts">
export default {
  name: 'App' as const,
  created() {
    this.$i18n.t('hello {name}', { name: 'DIO' })
  }
}
</script>
