<template>
  <main>
    <button type="button">
      {{ t('action.close') }}
    </button>

    <p>
      {{ t('action') }}
    </p>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<i18n locale="en-GB">
{
  "action": "Local action label"
}
</i18n>
