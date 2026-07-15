import {execFile} from 'node:child_process'
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest'

import {notify} from '../src'

vi.mock('node:child_process', () => ({
  execFile: vi.fn((_cmd: string, _args: string[], cb?: (err: Error | null, stdout: string, stderr: string) => void) => {
    if (typeof cb === 'function') cb(null, '', '')
    return {}
  }),
}))

const execFileMock = vi.mocked(execFile)

const originalPlatform = process.platform

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', {configurable: true, value: platform})
}

/** Returns the [command, args] of the single execFile call. */
function lastCall(): [string, string[]] {
  expect(execFileMock).toHaveBeenCalledTimes(1)
  const [cmd, args] = execFileMock.mock.calls[0]
  return [cmd as string, args as string[]]
}

describe('notify', () => {
  beforeEach(() => {
    execFileMock.mockClear()
    delete process.env.HEROKU_NOTIFICATIONS
  })

  afterEach(() => {
    setPlatform(originalPlatform)
  })

  describe('macOS', () => {
    beforeEach(() => setPlatform('darwin'))

    it('invokes osascript with a display notification script', () => {
      notify({message: 'dyno is up', subtitle: 'heroku run bash', title: 'my-app'})
      const [cmd, args] = lastCall()
      expect(cmd).toBe('osascript')
      expect(args[0]).toBe('-e')
      const script = args[1]
      expect(script).toContain('display notification "dyno is up"')
      expect(script).toContain('with title "my-app"')
      expect(script).toContain('subtitle "heroku run bash"')
    })

    it('adds a sound clause when sound is truthy', () => {
      notify({message: 'done', sound: true})
      const [, args] = lastCall()
      expect(args[1]).toContain('sound name "default"')
    })

    it('omits the sound clause when sound is absent', () => {
      notify({message: 'done'})
      const [, args] = lastCall()
      expect(args[1]).not.toContain('sound name')
    })

    it('escapes double quotes and backslashes in fields', () => {
      notify({message: 'say "hi"', title: String.raw`a\b`})
      const [, args] = lastCall()
      expect(args[1]).toContain(String.raw`display notification "say \"hi\""`)
      expect(args[1]).toContain(String.raw`with title "a\\b"`)
    })

    it('defaults the title to "Heroku CLI"', () => {
      notify({message: 'done'})
      const [, args] = lastCall()
      expect(args[1]).toContain('with title "Heroku CLI"')
    })
  })

  describe('Linux', () => {
    beforeEach(() => setPlatform('linux'))

    it('invokes notify-send with summary and body', () => {
      notify({message: 'dyno is up', subtitle: 'heroku run bash', title: 'my-app'})
      const [cmd, args] = lastCall()
      expect(cmd).toBe('notify-send')
      expect(args).toContain('my-app')
      // subtitle and message are joined into the body
      expect(args.some(a => a.includes('heroku run bash') && a.includes('dyno is up'))).toBe(true)
    })

    it('passes an --icon flag when icon is provided', () => {
      notify({icon: '/tmp/heroku.png', message: 'done'})
      const [, args] = lastCall()
      const iconIndex = args.indexOf('--icon')
      expect(iconIndex).toBeGreaterThanOrEqual(0)
      expect(args[iconIndex + 1]).toBe('/tmp/heroku.png')
    })
  })

  describe('Windows', () => {
    beforeEach(() => setPlatform('win32'))

    it('invokes powershell with a script containing the message and title', () => {
      notify({message: 'dyno is up', title: 'my-app'})
      const [cmd, args] = lastCall()
      expect(cmd.toLowerCase()).toContain('powershell')
      const script = args.join(' ')
      expect(script).toContain('dyno is up')
      expect(script).toContain('my-app')
    })
  })

  describe('gating', () => {
    beforeEach(() => setPlatform('darwin'))

    it('does nothing when HEROKU_NOTIFICATIONS=0', () => {
      process.env.HEROKU_NOTIFICATIONS = '0'
      notify({message: 'done'})
      expect(execFileMock).not.toHaveBeenCalled()
    })

    it('does nothing when HEROKU_NOTIFICATIONS=false', () => {
      process.env.HEROKU_NOTIFICATIONS = 'false'
      notify({message: 'done'})
      expect(execFileMock).not.toHaveBeenCalled()
    })

    it('still notifies when force is set despite HEROKU_NOTIFICATIONS=0', () => {
      process.env.HEROKU_NOTIFICATIONS = '0'
      notify({force: true, message: 'done'})
      expect(execFileMock).toHaveBeenCalledTimes(1)
    })

    it('does nothing on an unsupported platform', () => {
      setPlatform('freebsd' as NodeJS.Platform)
      notify({message: 'done'})
      expect(execFileMock).not.toHaveBeenCalled()
    })
  })

  describe('callback', () => {
    beforeEach(() => setPlatform('darwin'))

    it('invokes the callback when provided', () => {
      const cb = vi.fn()
      notify({message: 'done'}, cb)
      expect(cb).toHaveBeenCalledTimes(1)
    })
  })
})
