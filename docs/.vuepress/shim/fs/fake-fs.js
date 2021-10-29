export function statSync(filename) {
  return {
    mtimeMs: Date.now()
  }
}

let files = {}

export function existsSync(filename) {
  return Boolean(files[filename]) || filename === '.'
}
export function readFileSync(filename) {
  return files[filename] || files[filename.replace(/^\/path\//, '')] || ''
}

// utility
export function setFileContents(filesMap) {
  files = filesMap
}
export function getFiles() {
  return Object.keys(files)
}
