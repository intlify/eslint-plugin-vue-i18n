# @intlify/vue-i18n/no-html-messages

> disallow use HTML localization messages

- :star: The `"extends": "plugin:@intlify/vue-i18n/recommended"` property in a configuration file enables this rule.

This rule reports in order to reduce the risk of injecting potentially unsafe localization message into the browser leading to supply-chain attack or XSS attack.

## :book: Rule Details

This rule is aimed at eliminating HTML localization messages.

:-1: Examples of **incorrect** code for this rule:

locale messages:
```json
// ✗ BAD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! <span>DIO!</span>",
  "contenst": {
    "banner": "banner: <iframe src=\"https://banner.domain.com\" frameBorder=\"0\" style=\"z-index:100001;position:fixed;bottom:0;right:0\"/>",
    "modal": "modal: <span onmouseover=\"alert(document.cookie);\">modal content</span>"
  }
}
```

In localization codes of application:

```vue
<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
    <!-- supply-chain attack -->
    <div v-html="$t('contents.banner')"></div>
    <!-- XSS attack -->
    <div v-html="$t('contents.modal')"></div>
  </div>
</template>
```

```js
import Vue from 'vue'
import VueI18n from 'vue-i18n'

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

new Vue({
  i18n
  // ...
}).$mount('#app')
```

:+1: Examples of **correct** code for this rule:

locale messages:
```json
// ✓ GOOD
{
  "hello": "Hello! DIO!",
  "hi": "Hi! DIO!",
  "contents": {
    "banner": "banner: {0}",
    "modal": "modal: {0}"
  }
}
```

In localization codes of application:

```vue
<template>
  <div class="app">
    <p>{{ $t('hello') }}</p>
    <i18n path="contents.banner">
      <Banner :url="bannerURL"/>
    </i18n>
    <i18n path="contents.modal">
      <Modal :url="modalDataURL"/>
    </i18n>
  </div>
</template>
```

```js
import Vue from 'vue'
import VueI18n from 'vue-i18n'

// import some components used in i18n component
import Banner from './path/to/components/Banner.vue'
import Modal from './path/to/components/Modal.vue'

// register imprted components (in this example case, Vue.component)
Vue.component('Banner', Banner)
Vue.component('Modal', Modal)

const i18n = new VueI18n({
  locale: 'en',
  messages: {
    en: require('./locales/en.json')
  }
})

new Vue({
  i18n,
  data () {
    return {
      bannerURL: 'https://banner.domain.com',
      modalDataURL: 'https://fetch.domain.com'
    }
  }
  // ...
}).$mount('#app')
```

## :mute: When Not To Use It

If you are certain the localization message is trusted, you can disable this rule.

## :books: Further reading

- [XSS in Vue.js](https://blog.sqreen.io/xss-in-vue-js/)
- [Analysis of a Supply Chain Attack](https://medium.com/@hkparker/analysis-of-a-supply-chain-attack-2bd8fa8286ac)