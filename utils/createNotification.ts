import { createClient } from '@/utils/supabase/client'

export type NotificationType = 'faculty_approval' | 'comment' | 'nudge' | 'stale_warning' | 'general'

export interface NotificationPayload {
  user_id: string
  type: NotificationType
  title: string
  message: string
  project_id?: string
}

/**
 * Creates an in-app notification for a specific user.
 * Silently fails if the insert errors (notifications are non-critical).
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').insert(payload)
  if (error) {
    console.warn('[Notifications] Failed to create notification:', error.message)
  }
}

/**
 * Creates notifications for multiple users at once.
 */
export async function createNotifications(payloads: NotificationPayload[]): Promise<void> {
  if (!payloads.length) return
  const supabase = createClient()
  const { error } = await supabase.from('notifications').insert(payloads)
  if (error) {
    console.warn('[Notifications] Failed to create bulk notifications:', error.message)
  }
}
