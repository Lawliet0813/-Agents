/**
 * macOS Notification System
 * Sends system notifications for voice memo processing
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface NotificationOptions {
  title: string
  message: string
  subtitle?: string
  sound?: string
  actionUrl?: string
}

/**
 * Send macOS system notification
 */
export async function sendNotification(
  options: NotificationOptions
): Promise<void> {
  try {
    const { title, message, subtitle, sound = 'default', actionUrl } = options

    // Build osascript command for macOS notification
    let script = `display notification "${escapeString(message)}" with title "${escapeString(title)}"`

    if (subtitle) {
      script += ` subtitle "${escapeString(subtitle)}"`
    }

    if (sound) {
      script += ` sound name "${sound}"`
    }

    await execAsync(`osascript -e '${script}'`)

    console.log(`📬 Notification sent: ${title}`)

    // If action URL provided, could implement click handler
    // For now, just log it
    if (actionUrl) {
      console.log(`   Action URL: ${actionUrl}`)
    }
  } catch (error) {
    console.error('Failed to send notification:', error)
    // Don't throw - notification failure shouldn't break the main process
  }
}

/**
 * Escape string for osascript
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
}

/**
 * Send batch notification (for multiple items)
 */
export async function sendBatchNotification(
  title: string,
  items: string[]
): Promise<void> {
  const message =
    items.length <= 3 ? items.join('\n') : `${items.length} 個項目已處理`

  await sendNotification({
    title,
    message,
  })
}
