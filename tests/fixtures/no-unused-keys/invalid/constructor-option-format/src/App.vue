<template>
  <div id="app">
    <i18n-t keypath=hello_dio></i18n-t>
    <p>{{ $t('messages.hello') }}</p>
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
