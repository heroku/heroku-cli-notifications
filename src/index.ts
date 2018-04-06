import * as NodeNotifier from 'node-notifier'

export interface Notification extends NodeNotifier.Notification {
  force?: boolean
}

export function notify(notification: Notification = {}, callback?: NodeNotifier.NotificationCallback) {
  if (!notification.force || ['0', 'false'].includes(process.env.HEROKU_NOTIFICATIONS!)) return
  return NodeNotifier.notify(notification, callback)
}
