/**
 * @author Yosuke Ota
 */
import assert from 'assert'
import { parse } from '../../../../lib/utils/message-compiler/parser-v8'
import { parse as parseForV9 } from '../../../../lib/utils/message-compiler/parser'
import { errorsFixtures } from './parser-v8-data'

describe('parser-v8', () => {
  describe('compare v9', () => {
    const list = [
      'message',
      'Hello World!',
      'Hello {target}!',
      'Hello { target }!',
      'Hello @:link',
      'Hello @.lower:link',
      'car | cars',
      'no apples | one apple | {count} apples',
      'no apples |\n one apple |\n {count} apples',
      'empty placeholder {     }',
      'number placeholder {  42   }',
      'number placeholder {  -42   }'
    ]
    for (const code of list) {
      describe(JSON.stringify(code), () => {
        it('should be equals', () => {
          const v8 = normalize(parse(code))
          const v9 = normalize(parseForV9(code))
          assert.deepStrictEqual(v8, v9)
        })
      })
    }
  })
  describe('errors', () => {
    const list = errorsFixtures
    for (const { code, expected } of list) {
      describe(JSON.stringify(code), () => {
        it('should be equals', () => {
          const parsed = simply(parse(code))
          try {
            assert.deepStrictEqual(parsed, expected)
          } catch (e) {
            // require('fs').writeFileSync(
            //   __dirname + '/actual.json',
            //   JSON.stringify(parsed, null, 2)
            // )
            throw e
          }
        })
      })
    }
  })
})

function normalize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (key === 'source' || key === 'domain') {
        return undefined
      }
      if (key === 'end' && typeof value === 'number') {
        return undefined
      }
      if (value instanceof Error) {
        return {
          // @ts-expect-error -- ignore
          message: value.message,
          ...value
        }
      }
      return value
    })
  )
}
function simply(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (key === 'domain') {
        return undefined
      }
      if (key === 'end' && typeof value === 'number') {
        return undefined
      }
      if (key === 'start' && typeof value === 'number') {
        return undefined
      }
      if (key === 'loc' || key === 'location') {
        return [value.start.offset, value.end.offset]
      }
      if (key === 'type') {
        return NodeTypes[value]
      }
      if (value instanceof Error) {
        return {
          // @ts-expect-error -- ignore
          message: value.message,
          ...value
        }
      }
      return value
    })
  )
}

enum NodeTypes {
  Resource = 0,
  Plural = 1,
  Message = 2,
  Text = 3,
  Named = 4,
  List = 5,
  Linked = 6,
  LinkedKey = 7,
  LinkedModifier = 8,
  Literal = 9
}
