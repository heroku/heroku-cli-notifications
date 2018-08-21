import * as NodeNotifier from 'node-notifier'
import * as path from 'path'

export interface Notification extends NodeNotifier.Notification {
  force?: boolean
}

export function notify(notification: Notification = {}, callback?: NodeNotifier.NotificationCallback) {
  if (!notification.force && ['0', 'false'].includes(process.env.HEROKU_NOTIFICATIONS!)) return
  return NodeNotifier.notify({
    title: 'Heroku CLI',
    icon: path.join(__dirname, '../assets/heroku.png'),
    appName: 'Microsoft.Windows.ShellExperienceHost_cw5n1h2txyewy!App',
    ...notification,
  } as Notification, callback)
}
