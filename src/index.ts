import * as NodeNotifier from 'node-notifier'
import * as path from 'path'

export interface Notification extends NodeNotifier.Notification {
  force?: boolean
}

export function notify(notification: Notification = {}, callback?: NodeNotifier.NotificationCallback) {
  if (!notification.force && ['0', 'false'].includes(process.env.HEROKU_NOTIFICATIONS!)) return
  return NodeNotifier.notify({
    icon: path.join(__dirname, '../assets/heroku.png'),
    ...notification,
  } as Notification, callback)
}
