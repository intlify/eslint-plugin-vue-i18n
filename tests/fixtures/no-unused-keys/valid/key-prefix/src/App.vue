<template>
  <div id="app">
    <p>{{ $t('hello') }}</p>
    <p>{{ $t('messages.nested.hello') }}</p>
    <p>{{ $t('errors.required') }}</p>
    <p>{{ $t('errors.nested.field') }}</p>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
