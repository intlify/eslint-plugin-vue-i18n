/**
 * @author Yosuke Ota
 */
import { deepStrictEqual } from 'assert'
import type { RuleContext } from '../../../lib/types'
import { collectLinkedKeys } from '../../../lib/utils/collect-linked-keys'

function createContext(messageSyntaxVersion?: string): RuleContext {
  return {
    settings: {
      'vue-i18n': {
        messageSyntaxVersion
      }
    }
  } as RuleContext
}

describe('collectLinkedKeys', () => {
  it('should be get the keys used in the plain linked message.', () => {
    const object = {
      message: {
        the_world: 'the world',
        dio: 'DIO:',
        linked: '@:message.dio @:message.the_world !!!!'
      }
    }

    const expected = ['message.dio', 'message.the_world']
    deepStrictEqual(collectLinkedKeys(object, createContext()), expected)
  })
  it('should be get the keys used in the formatting linked message.', () => {
    const object = {
      message: {
        homeAddress: 'Home address',
        missingHomeAddress: 'Please provide @.lower:message.homeAddress'
      }
    }

    const expected = ['message.homeAddress']
    deepStrictEqual(collectLinkedKeys(object, createContext()), expected)
  })
  it('should be get the keys used in the linked message with brackets.', () => {
    const object = {
      message: {
        dio: 'DIO',
        linked: "There's a reason, you lost, @:(message.dio)."
      }
    }

    const expected = ['message.dio']
    deepStrictEqual(collectLinkedKeys(object, createContext()), expected)
  })
  it('should be get the keys used in the linked message for v9.', () => {
    const object = {
      message: {
        dio: 'DIO',
        linked: "There's a reason, you lost, @:{'message.dio'}.",
        list_linked: 'hi @:{42}!'
      }
    }

    const expected = ['message.dio', '42']
    deepStrictEqual(collectLinkedKeys(object, createContext()), expected)
  })

  describe('should be get the keys used in the linked message.', () => {
    const object = {
      foo: {
        a: 'Hi',
        b: '@:foo.a lorem ipsum @:bar.a !!!!',
        c: {
          a: '@:(bar.b) @:bar.c.a',
          b: "@:{'bar.d'}"
        },
        d: 'Hello'
      },
      bar: {
        a: 'Yes',
        b: {
          a: '@.lower:foo.b',
          // invaid values
          b: null,
          c: 123,
          e: /reg/,
          f: () => {
            // noop
          },
          g: [true, false]
        }
      }
    }

    it('v9', () => {
      const expected = ['bar.a', 'bar.c.a', 'bar.d', 'foo.a', 'foo.b']
      deepStrictEqual(
        collectLinkedKeys(object as never, createContext('^9.0.0')).sort(),
        expected
      )
    })
    it('v8', () => {
      const expected = ['bar.a', 'bar.b', 'bar.c.a', 'foo.a', 'foo.b']
      deepStrictEqual(
        collectLinkedKeys(object as never, createContext('^8.0.0')).sort(),
        expected
      )
    })
    it('default', () => {
      const expected = ['bar.a', 'bar.b', 'bar.c.a', 'bar.d', 'foo.a', 'foo.b']
      deepStrictEqual(
        collectLinkedKeys(object as never, createContext()).sort(),
        expected
      )
    })
    it('>=v8', () => {
      const expected = ['bar.a', 'bar.b', 'bar.c.a', 'bar.d', 'foo.a', 'foo.b']
      deepStrictEqual(
        collectLinkedKeys(object as never, createContext('>=8.0.0')).sort(),
        expected
      )
    })
  })
})
