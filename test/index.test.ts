import {notify} from '../src'

describe('notify', () => {
  it('notifies', () => {
    notify({title: 'test notification', message: 'body'})
  })
})
