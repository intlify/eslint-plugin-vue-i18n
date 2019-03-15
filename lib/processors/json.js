/**
 * @fileoverview JSON processor
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

const localeMessageFiles = {}

module.exports = {
  preprocess (text, filename) {
    localeMessageFiles[filename] = text
    // JSON into a JavaScript comment
    const textBuf = Buffer.from(text.trim())
    const filenameBuf = Buffer.from(filename)
    return [`/*${textBuf.toString('base64')}*//*${filenameBuf.toString('base64')}*/\n`]
  },

  postprocess ([errors], filename) {
    delete localeMessageFiles[filename]
    return [...errors.filter(
      error => !error.ruleId || error.ruleId === 'vue-i18n/no-unused-keys'
    )]
  },

  supportsAutofix: true
}
