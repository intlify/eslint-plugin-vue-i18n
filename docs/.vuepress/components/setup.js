if (typeof window !== 'undefined') {
  window.process = {
    cwd() {
      return ''
    }
  }
}
