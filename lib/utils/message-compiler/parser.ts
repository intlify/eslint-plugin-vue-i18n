import type { CompileError, ResourceNode } from '@intlify/message-compiler'
import { createParser } from '@intlify/message-compiler'

export function parse(code: string): {
  ast: ResourceNode
  errors: CompileError[]
} {
  const errors: CompileError[] = []
  const parser = createParser({
    onError(error: CompileError) {
      errors.push(error)
    }
  })
  const ast = parser.parse(code)
  return {
    ast,
    errors
  }
}
