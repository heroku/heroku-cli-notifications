import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const {nodeNotify} = vi.hoisted(() => ({
  nodeNotify: vi.fn(),
}))

vi.mock('node-notifier', () => ({
  notify: nodeNotify,
}))

import {notify} from '../src'

const originalArch = Object.getOwnPropertyDescriptor(process, 'arch')!
const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!

function setProcessTarget(platform: NodeJS.Platform, arch: string) {
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: platform,
  })
  Object.defineProperty(process, 'arch', {
    configurable: true,
    value: arch,
  })
}

describe('notify', () => {
  beforeEach(() => {
    setProcessTarget('linux', 'x64')
  })

  afterEach(() => {
    Object.defineProperty(process, 'arch', originalArch)
    Object.defineProperty(process, 'platform', originalPlatform)
    vi.unstubAllEnvs()
    nodeNotify.mockReset()
  })

  it('notifies', () => {
    notify({message: 'body', title: 'test notification'})

    expect(nodeNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: expect.stringContaining('assets/heroku.png'),
        message: 'body',
        title: 'test notification',
      }),
      undefined,
    )
  })

  it('does not notify when notifications are disabled', () => {
    vi.stubEnv('HEROKU_NOTIFICATIONS', 'false')

    notify({message: 'body', title: 'test notification'})

    expect(nodeNotify).not.toHaveBeenCalled()
  })

  it('notifies when notifications are forced even if the environment disables them', () => {
    vi.stubEnv('HEROKU_NOTIFICATIONS', 'false')

    notify({force: true, message: 'body', title: 'test notification'})

    expect(nodeNotify).toHaveBeenCalledOnce()
  })

  it('does not invoke the bundled notifier on Apple Silicon macOS', () => {
    setProcessTarget('darwin', 'arm64')

    notify({message: 'body', title: 'test notification'})

    expect(nodeNotify).not.toHaveBeenCalled()
  })

  it('does not invoke the bundled notifier on Apple Silicon macOS when forced', () => {
    setProcessTarget('darwin', 'arm64')

    notify({
      force: true,
      message: 'body',
      title: 'test notification',
    })

    expect(nodeNotify).not.toHaveBeenCalled()
  })
})
