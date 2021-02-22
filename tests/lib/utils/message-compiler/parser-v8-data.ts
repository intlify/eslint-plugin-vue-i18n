export const errorsFixtures: {
  code: string
  expected: Record<string, unknown>
}[] = [
  {
    code: '@: empty key',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [2, 2]
              },
              loc: [0, 2]
            },
            {
              type: 'Text',
              value: ' empty key',
              loc: [2, 12]
            }
          ],
          loc: [0, 12]
        },
        loc: [0, 12]
      },
      errors: [
        {
          message: 'Expected linked key value',
          location: [2, 2]
        }
      ]
    }
  },
  {
    code: '@. empty mod',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [2, 2]
              },
              loc: [0, 2],
              modifier: {
                type: 'LinkedModifier',
                value: '',
                loc: [1, 2]
              }
            },
            {
              type: 'Text',
              value: ' empty mod',
              loc: [2, 12]
            }
          ],
          loc: [0, 12]
        },
        loc: [0, 12]
      },
      errors: [
        {
          message: 'Expected linked modifier value',
          location: [1, 1]
        },
        {
          message: 'Expected linked key value',
          location: [2, 2]
        }
      ]
    }
  },
  {
    code: '@.: empty key and mod',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [3, 3]
              },
              loc: [0, 3],
              modifier: {
                type: 'LinkedModifier',
                value: '',
                loc: [1, 2]
              }
            },
            {
              type: 'Text',
              value: ' empty key and mod',
              loc: [3, 21]
            }
          ],
          loc: [0, 21]
        },
        loc: [0, 21]
      },
      errors: [
        {
          message: 'Expected linked modifier value',
          location: [1, 1]
        },
        {
          message: 'Expected linked key value',
          location: [3, 3]
        }
      ]
    }
  },
  {
    code: '@.mod: empty key',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [6, 6]
              },
              loc: [0, 6],
              modifier: {
                type: 'LinkedModifier',
                value: 'mod',
                loc: [1, 5]
              }
            },
            {
              type: 'Text',
              value: ' empty key',
              loc: [6, 16]
            }
          ],
          loc: [0, 16]
        },
        loc: [0, 16]
      },
      errors: [
        {
          message: 'Expected linked key value',
          location: [6, 6]
        }
      ]
    }
  },
  {
    code: '@.mod only mod',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [5, 5]
              },
              loc: [0, 5],
              modifier: {
                type: 'LinkedModifier',
                value: 'mod',
                loc: [1, 5]
              }
            },
            {
              type: 'Text',
              value: ' only mod',
              loc: [5, 14]
            }
          ],
          loc: [0, 14]
        },
        loc: [0, 14]
      },
      errors: [
        {
          message: 'Expected linked key value',
          location: [5, 5]
        }
      ]
    }
  },
  {
    code: '@: empty key',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [2, 2]
              },
              loc: [0, 2]
            },
            {
              type: 'Text',
              value: ' empty key',
              loc: [2, 12]
            }
          ],
          loc: [0, 12]
        },
        loc: [0, 12]
      },
      errors: [
        {
          message: 'Expected linked key value',
          location: [2, 2]
        }
      ]
    }
  },
  {
    code: '@:() key with paren',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: '',
                loc: [3, 3]
              },
              loc: [0, 4]
            },
            {
              type: 'Text',
              value: ' key with paren',
              loc: [4, 19]
            }
          ],
          loc: [0, 19]
        },
        loc: [0, 19]
      },
      errors: [
        {
          message: 'Expected linked key value',
          location: [3, 3]
        }
      ]
    }
  },
  {
    code: '@:(foo) key with paren v8',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: 'foo',
                loc: [3, 6]
              },
              loc: [0, 7]
            },
            {
              type: 'Text',
              value: ' key with paren v8',
              loc: [7, 25]
            }
          ],
          loc: [0, 25]
        },
        loc: [0, 25]
      },
      errors: []
    }
  },
  {
    code: 'unclose paren for v8 @:(foo.bar',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Text',
              value: 'unclose paren for v8 ',
              loc: [0, 21]
            },
            {
              type: 'Linked',
              key: {
                type: 'LinkedKey',
                value: 'foo.bar',
                loc: [24, 31]
              },
              loc: [21, 31]
            }
          ],
          loc: [0, 31]
        },
        loc: [0, 31]
      },
      errors: [
        {
          message: 'Unterminated closing paren',
          location: [31, 31]
        }
      ]
    }
  },
  {
    code: 'unclose brace { foo',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Text',
              value: 'unclose brace ',
              loc: [0, 14]
            },
            {
              type: 'Named',
              key: 'foo',
              loc: [14, 20]
            }
          ],
          loc: [0, 19]
        },
        loc: [0, 19]
      },
      errors: [
        {
          message: 'Unterminated closing brace',
          location: [15, 15]
        },
        {
          message: 'Unexpected space before or after the placeholder key',
          location: [15, 15]
        }
      ]
    }
  },
  {
    code: 'error placeholder {foo.bar}',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Text',
              value: 'error placeholder ',
              loc: [0, 18]
            },
            {
              type: 'Named',
              key: 'foo.bar',
              loc: [18, 27]
            }
          ],
          loc: [0, 27]
        },
        loc: [0, 27]
      },
      errors: [
        {
          message: 'Unexpected placeholder key',
          location: [19, 19]
        }
      ]
    }
  },
  {
    code: 'error placeholder { foo.bar }',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Text',
              value: 'error placeholder ',
              loc: [0, 18]
            },
            {
              type: 'Named',
              key: 'foo.bar',
              loc: [18, 29]
            }
          ],
          loc: [0, 29]
        },
        loc: [0, 29]
      },
      errors: [
        {
          message: 'Unexpected space before or after the placeholder key',
          location: [19, 19]
        },
        {
          message: 'Unexpected placeholder key',
          location: [19, 19]
        }
      ]
    }
  },
  {
    code: 'spaced placeholder { foo }',
    expected: {
      ast: {
        type: 'Resource',
        body: {
          type: 'Message',
          items: [
            {
              type: 'Text',
              value: 'spaced placeholder ',
              loc: [0, 19]
            },
            {
              type: 'Named',
              key: 'foo',
              loc: [19, 26]
            }
          ],
          loc: [0, 26]
        },
        loc: [0, 26]
      },
      errors: [
        {
          message: 'Unexpected space before or after the placeholder key',
          location: [20, 20]
        }
      ]
    }
  }
]
