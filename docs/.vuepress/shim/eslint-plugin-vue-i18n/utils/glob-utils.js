import { getFiles } from '../../fs/fake-fs'
export function listFilesToProcess() {
  return getFiles()
    .filter(filename => /\.(?:vue|js)$/i.test(filename))
    .map(filename => ({ filename, ignored: false }))
}
