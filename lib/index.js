/**
 * @fileoverview ESLint plugin for vue-i18n
 * @author kazuya kawaguchi (a.k.a. kazupon)
 */
'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

// ------------------------------------------------------------------------------
// Plugin Definition
// ------------------------------------------------------------------------------

// import all rules in lib/rules
module.exports.rules = {
  'no-missing-key': require('./rules/no-missing-key')
}

// import processors
module.exports.processors = {
  // add your processors here
}
