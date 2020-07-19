/**
 * @author Yosuke Ota
 */
'use strict'

const assert = require('assert')
const collectLinkedKeys = require('../../../lib/utils/collect-linked-keys')

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
    assert.deepStrictEqual(collectLinkedKeys(object), expected)
  })
  it('should be get the keys used in the formatting linked message.', () => {
    const object = {
      message: {
        homeAddress: 'Home address',
        missingHomeAddress: 'Please provide @.lower:message.homeAddress'
      }
    }

    const expected = ['message.homeAddress']
    assert.deepStrictEqual(collectLinkedKeys(object), expected)
  })
  it('should be get the keys used in the linked message with brackets.', () => {
    const object = {
      message: {
        dio: 'DIO',
        linked: 'There\'s a reason, you lost, @:(message.dio).'
      }
    }

    const expected = ['message.dio']
    assert.deepStrictEqual(collectLinkedKeys(object), expected)
  })

  it('should be get the keys used in the linked message.', () => {
    const object = {
      foo: {
        a: 'Hi',
        b: '@:foo.a lorem ipsum @:bar.a !!!!',
        c: {
          a: '@:(bar.a) @:bar.b.a'
        },
        d: 'Hello'
      },
      bar: {
        a: 'Yes',
        b: {
          a: '@.lower:foo.d',
          // invaid values
          b: null,
          c: 123,
          e: /reg/,
          f: () => {},
          g: [true, false]
        }
      }
    }

    const expected = [
      'foo.a',
      'bar.a',
      'bar.b.a',
      'foo.d'
    ]
    assert.deepStrictEqual(collectLinkedKeys(object), expected)
  })
})
