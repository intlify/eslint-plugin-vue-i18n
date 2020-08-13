<i18n lang="yaml">
en:
  block: block
  nest:
    foo
ja:
  block: block
  nest:
    foo: bar
</i18n>
<i18n lang="yaml">
en:
  nest:
    foo: bar
ja:
  dupe: dupe
</i18n>
<i18n lang="json">
{
  "en": {
    "json-dupe": "dupe",
    "nest": {
      "json-dupe": "dupe"
    },
    "nest": {
      "json-dupe": "dupe"
    },
    "json-dupe": "dupe"
  }
}
</i18n>
<template></template>
<script></script>
