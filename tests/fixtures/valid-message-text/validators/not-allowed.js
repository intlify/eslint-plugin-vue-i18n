module.exports = text => [
  !text.includes('not-allowed'),
  'Contains "not-allowed"'
]
