import * as path from 'node:path'
import {Notification as NodeNotification, NotificationCallback, notify as nodeNotify} from 'node-notifier'
export interface Notification extends NodeNotification {
  force?: boolean
}

export function notify(notification: Notification = {}, callback?: NotificationCallback) {
  if (!notification.force && ['0', 'false'].includes(process.env.HEROKU_NOTIFICATIONS!)) return
  return nodeNotify({
    appName: 'Microsoft.Windows.ShellExperienceHost_cw5n1h2txyewy!App',
    icon: path.join(__dirname, '../assets/heroku.png'),
    title: 'Heroku CLI',
    ...notification,
  } as Notification, callback)
}
