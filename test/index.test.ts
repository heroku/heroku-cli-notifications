import {describe, it} from 'vitest'

import {notify} from '../src'

describe('notify', () => {
  it('notifies', () => {
    notify({message: 'body', title: 'test notification'})
  })
})
