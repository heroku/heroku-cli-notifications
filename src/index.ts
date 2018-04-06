import * as NodeNotifier from 'node-notifier'

export function notify(notification?: NodeNotifier.Notification, callback?: NodeNotifier.NotificationCallback) {
  if (['0', 'false'].includes(process.env.HEROKU_NOTIFICATIONS!)) return
  return NodeNotifier.notify(notification, callback)
}
