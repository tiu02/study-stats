import { format, differenceInCalendarDays } from 'date-fns'

export function formatDuration(minutes) {
  if (!minutes || isNaN(minutes)) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDate(value) {
  if (!value) return ''
  const d = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  return format(d, 'MMM d, yyyy')
}

export const STATUS_LABELS = {
  'complete': 'Complete',
  'in-progress': 'In Progress',
  'incomplete': 'Incomplete',
}

export const STATUS_ICONS = {
  'complete': 'check_circle',
  'in-progress': 'pending',
  'incomplete': 'cancel',
}

export function formatDueLabel(urgency, dueDate) {
  return urgency === 'overdue'
    ? `Overdue: ${formatDate(dueDate)}`
    : `Due ${formatDate(dueDate)}`
}

/**
 * Returns urgency level for an assignment due date.
 * 'overdue' = past due, 'urgent' = ≤2 days, 'soon' = ≤5 days, null = no urgency.
 */
export function getUrgency(dueDate) {
  if (!dueDate) return null
  const d = typeof dueDate.toDate === 'function' ? dueDate.toDate() : new Date(dueDate)
  const daysUntil = differenceInCalendarDays(d, new Date())
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 2) return 'urgent'
  if (daysUntil <= 5) return 'soon'
  return null
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
}

export function cardBackground(hex) {
  const rgb = hexToRgb(hex || '#6366F1')
  if (!rgb) return undefined
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`
}
