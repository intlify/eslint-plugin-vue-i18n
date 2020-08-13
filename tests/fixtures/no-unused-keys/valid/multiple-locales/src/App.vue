<template>
  <div id="app">
    <p v-t="'hello_dio'">{{ $t('messages.link') }}</p>
    <i18n path="term" tag="label" for="tos">
      <a :href="url" target="_blank">{{ $t('tos') }}</a>
    </i18n>
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
