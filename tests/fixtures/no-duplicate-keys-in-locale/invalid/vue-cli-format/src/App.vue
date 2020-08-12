<i18n locale="en" lang="yaml">
block: block
nest:
    foo: bar
</i18n>
<i18n locale="ja" lang="yaml">
block: block
nest:
    foo: bar
dupe: dupe
</i18n>
<i18n locale="en" lang="yaml">
block: block
nest:
    foo: bar
</i18n>
<i18n locale="en" lang="json">
{
  "json-dupe": "dupe",
  "nest": {
    "json-dupe": "dupe"
  },
  "nest": {
    "json-dupe": "dupe"
  },
  "json-dupe": "dupe"
}
</i18n>
<template></template>
<script></script>
