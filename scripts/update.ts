import { update as updateRuleDocs } from './update-rule-docs'
import { update as updateDocsIndex } from './update-index-docs'
import { update as updateLegacyBaseConfigs } from './update-legacy-base-configs'
import { update as updateLegacyRecommentedConfigs } from './update-legacy-recommended-configs'
import { update as updateIndex } from './update-index'

async function main() {
  // update docs.
  await updateRuleDocs()
  await updateDocsIndex()

  // legacy configs
  await updateLegacyBaseConfigs()
  await updateLegacyRecommentedConfigs()

  // lib index
  await updateIndex()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
