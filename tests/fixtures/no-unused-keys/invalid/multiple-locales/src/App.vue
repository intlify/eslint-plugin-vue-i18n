<template>
  <div id="app">
    <p v-t="'hello_dio'">{{ $t('messages.hello') }}</p>
  </div>
</template>

<script>
export default {
  name: 'App',
  created() {
    this.$i18n.t('hello {name}', { name: 'DIO' })
  }
}
</script>
