export const LEVELS = {
  critical: { label: 'Critical', color: '#e11d48', soft: '#ffe4e6', text: 'text-coral-600', bg: 'bg-coral-100' },
  high: { label: 'High', color: '#f97316', soft: '#ffedd5', text: 'text-orange-600', bg: 'bg-orange-100' },
  medium: { label: 'Medium', color: '#f59e0b', soft: '#fef3c7', text: 'text-amber-600', bg: 'bg-sun-100' },
  low: { label: 'Low', color: '#0ea5e9', soft: '#e0f2fe', text: 'text-sky2-600', bg: 'bg-sky2-100' },
  clean: { label: 'Cleaned', color: '#10b981', soft: '#d1fadf', text: 'text-leaf-700', bg: 'bg-leaf-100' },
}

export const STATUS = {
  assigned: { label: 'Sent to officer', tone: 'bg-sky2-100 text-sky2-600' },
  in_progress: { label: 'Work started', tone: 'bg-sun-100 text-amber-700' },
  cleaned: { label: 'Cleaned', tone: 'bg-leaf-100 text-leaf-700' },
}

export const seenCount = (r) => 1 + (r.seenBy?.length || 0) + (r.seenExtra || 0)

export function priority(r, now = Date.now()) {
  if (r.status === 'cleaned') return { score: 0, level: 'clean' }
  const sev = r.ai?.severity ?? 5
  const ageDays = (now - r.createdAt) / 864e5
  const score = sev * (1 + 0.5 * Math.log2(seenCount(r))) + Math.min(ageDays, 30) * 0.3
  const level = score >= 15 ? 'critical' : score >= 9 ? 'high' : score >= 5.5 ? 'medium' : 'low'
  return { score, level }
}

// Escalates one level for every multiple of the AI's urgency window that passes untouched.
export function escalation(r, now = Date.now()) {
  if (r.status === 'cleaned') return { overdue: false, level: 0, overdueMs: 0 }
  const windowMs = Math.max(6, r.ai?.urgency_hours || 48) * 3600e3
  const startedAt = r.status === 'in_progress' ? r.timeline?.find((t) => t.type === 'progress')?.at : null
  const base = startedAt ? startedAt + windowMs : r.createdAt + windowMs
  const overdueMs = now - base
  if (overdueMs <= 0) return { overdue: false, level: 0, overdueMs: 0, dueAt: base }
  return { overdue: true, level: Math.min(2, 1 + Math.floor(overdueMs / windowMs)), overdueMs, dueAt: base }
}

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Nearest open report within `radius` metres, so people back it instead of filing a duplicate.
export function findDuplicate(loc, reports, radius = 150) {
  if (!loc) return null
  let best = null
  for (const r of reports) {
    if (r.status === 'cleaned') continue
    const d = distanceMeters(loc, r.location)
    if (d <= radius && (!best || d < best.d)) best = { r, d }
  }
  return best
}

export function timeAgo(ts, now = Date.now()) {
  const s = Math.max(1, Math.round((now - ts) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

export function duration(ms) {
  const h = Math.round(ms / 3600e3)
  if (h < 1) return 'under an hour'
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'}`
  return `${Math.round(h / 24)} days`
}
