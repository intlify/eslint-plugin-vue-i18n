// Using the `esm` package we can't use the new syntax that we have now.
// To solve the problem, copy the `shipjs` bin file and replace it to use esbuild.

const esbuildRegister = require('esbuild-register/dist/node')

esbuildRegister.register({
  target: 'node12',
  hookIgnoreNodeModules: false
})

// require = require('esm')(module);
;(async function () {
  try {
    process.env.SHIPJS = true
    await require('shipjs/src/cli').cli(process.argv)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
