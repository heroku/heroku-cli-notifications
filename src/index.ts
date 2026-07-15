import {execFile} from 'node:child_process'
import * as path from 'node:path'

export type NotificationCallback = (error: Error | null, response: string) => void

export interface Notification {
  /** deliver even when HEROKU_NOTIFICATIONS is disabled */
  force?: boolean
  /** absolute path to an icon (Linux only) */
  icon?: string
  /** body text of the notification */
  message?: string
  /** play a sound with the notification */
  sound?: boolean | string
  /** secondary text shown below the title (macOS only) */
  subtitle?: string
  /** main title; defaults to "Heroku CLI" */
  title?: string
}

const DEFAULT_TITLE = 'Heroku CLI'
const DEFAULT_ICON = path.join(__dirname, '../assets/heroku.png')

/**
 * Escapes a value for use inside an AppleScript double-quoted string literal.
 * Backslashes must be escaped before quotes so the added escapes are not re-escaped.
 */
function escapeAppleScript(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`)
}

/**
 * Escapes a value for use inside a PowerShell single-quoted string literal,
 * where the only special character is the single quote itself (doubled).
 */
function escapePowerShell(value: string): string {
  return value.replaceAll("'", "''")
}

function notifyDarwin(n: Notification): [string, string[]] {
  const title = escapeAppleScript(n.title ?? DEFAULT_TITLE)
  let script = `display notification "${escapeAppleScript(n.message ?? '')}" with title "${title}"`
  if (n.subtitle) script += ` subtitle "${escapeAppleScript(n.subtitle)}"`
  if (n.sound) script += ' sound name "default"'
  return ['osascript', ['-e', script]]
}

function notifyLinux(n: Notification): [string, string[]] {
  const summary = n.title ?? DEFAULT_TITLE
  const body = [n.subtitle, n.message].filter(Boolean).join('\n')
  const args: string[] = []
  const icon = n.icon ?? DEFAULT_ICON
  if (icon) args.push('--icon', icon)
  args.push(summary, body)
  return ['notify-send', args]
}

function notifyWindows(n: Notification): [string, string[]] {
  const title = escapePowerShell(n.title ?? DEFAULT_TITLE)
  const message = escapePowerShell(n.message ?? '')
  // Build a WinRT toast from the bundled ToastText02 template via PowerShell.
  const script = [
    '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;',
    '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null;',
    '$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);',
    '$texts = $template.GetElementsByTagName("text");',
    `$texts.Item(0).AppendChild($template.CreateTextNode('${title}')) | Out-Null;`,
    `$texts.Item(1).AppendChild($template.CreateTextNode('${message}')) | Out-Null;`,
    '$toast = [Windows.UI.Notifications.ToastNotification]::new($template);',
    `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${title}').Show($toast);`,
  ].join(' ')
  return ['powershell', ['-NoProfile', '-NonInteractive', '-Command', script]]
}

const dispatchers: Partial<Record<NodeJS.Platform, (n: Notification) => [string, string[]]>> = {
  darwin: notifyDarwin,
  linux: notifyLinux,
  win32: notifyWindows,
}

/**
 * Display a desktop notification using the host OS's native tooling
 * (osascript on macOS, notify-send on Linux, PowerShell toast on Windows).
 *
 * Best-effort and fire-and-forget: any failure (missing tool, unsupported
 * platform) is swallowed so callers never see a notification break a command.
 */
export function notify(notification: Notification = {}, callback?: NotificationCallback) {
  if (!notification.force && ['0', 'false'].includes(process.env.HEROKU_NOTIFICATIONS!)) return

  const dispatcher = dispatchers[process.platform]
  if (!dispatcher) {
    callback?.(null, '')
    return
  }

  try {
    const [command, args] = dispatcher(notification)
    execFile(command, args, error => {
      callback?.(error, '')
    })
  } catch {
    callback?.(null, '')
  }
}
