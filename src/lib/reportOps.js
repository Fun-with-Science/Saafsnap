import { DEPARTMENTS, wardFor, officerFor } from './departments'

const displayName = (user) => user.org?.name || user.name

const str = (v, d = '') => (typeof v === 'string' ? v : d)
const strs = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const STATUSES = ['assigned', 'in_progress', 'cleaned']

// Data from the shared database is untrusted: one malformed row must never crash the app.
export function sanitizeReport(r) {
  const a = r.ai && typeof r.ai === 'object' ? r.ai : {}
  const c = r.cleanup && typeof r.cleanup === 'object' && typeof r.cleanup.photo === 'string' ? r.cleanup : null
  return {
    ...r,
    photo: str(r.photo),
    landmark: str(r.landmark),
    ward: num(r.ward, 1),
    department: DEPARTMENTS[r.department] ? r.department : 'swm',
    status: STATUSES.includes(r.status) ? r.status : 'assigned',
    location: { lat: num(r.location?.lat, 22.5726), lng: num(r.location?.lng, 88.3639) },
    seenBy: strs(r.seenBy),
    seenExtra: Math.max(0, num(r.seenExtra, 0)),
    likes: strs(r.likes),
    timeline: Array.isArray(r.timeline)
      ? r.timeline.filter((t) => t && typeof t === 'object').map((t) => ({ ...t, type: str(t.type, 'sent'), at: num(t.at, r.createdAt), text: str(t.text) }))
      : [],
    cleanup: c && {
      ...c,
      at: num(c.at, r.createdAt),
      verification: c.verification && Array.isArray(c.verification.checks) ? c.verification : { verified: true, checks: [] },
    },
    attempts: Array.isArray(r.attempts) ? r.attempts : [],
    ai: {
      ...a,
      title: str(a.title, 'Reported spot'),
      summary: str(a.summary),
      waste_types: strs(a.waste_types),
      hazards: strs(a.hazards),
      severity: Math.min(10, Math.max(1, Math.round(num(a.severity, 5)))),
      volume: str(a.volume, 'Medium (handcart load)'),
      environment: str(a.environment, 'other'),
      recommended_action: str(a.recommended_action),
      urgency_hours: Math.max(6, num(a.urgency_hours, 48)),
      complaint_text: str(a.complaint_text),
      confidence: num(a.confidence, 0.5),
      source: str(a.source, 'demo'),
    },
  }
}

export function newReport(me, { photo, location, landmark, ai, exif }, id) {
  const now = Date.now()
  const dept = DEPARTMENTS[ai.primary_category] || DEPARTMENTS.swm
  const ward = wardFor(location)
  return {
    id,
    createdBy: me.id,
    createdAt: now,
    photo,
    location: { lat: location.lat, lng: location.lng },
    landmark: landmark?.trim() || '',
    ward,
    department: dept.id,
    ai,
    exif: exif || null,
    seenBy: [],
    seenExtra: 0,
    status: 'assigned',
    timeline: [
      { type: 'reported', at: now, by: me.id, text: `Reported by ${me.name}` },
      { type: 'ai', at: now + 1, text: `AI tagged it as ${dept.name.toLowerCase()} · severity ${ai.severity}/10` },
      { type: 'sent', at: now + 2, text: `Complaint sent to ${officerFor(dept.id, ward)}` },
    ],
    cleanup: null,
    attempts: [],
  }
}

export function withSeen(r, me) {
  if (r.seenBy.includes(me.id) || r.createdBy === me.id || r.status === 'cleaned') return r
  return { ...r, seenBy: [...r.seenBy, me.id], timeline: [...r.timeline, { type: 'seen', at: Date.now(), by: me.id, text: `${me.name} saw this too` }] }
}

export function withLike(r, me) {
  if (r.status !== 'cleaned') return r
  const likes = r.likes || []
  return { ...r, likes: likes.includes(me.id) ? likes.filter((id) => id !== me.id) : [...likes, me.id] }
}

export function withProgress(r, me) {
  if (r.status !== 'assigned' || me.role !== 'govt' || me.status !== 'active' || me.org?.department !== r.department) return r
  return { ...r, status: 'in_progress', timeline: [...r.timeline, { type: 'progress', at: Date.now(), by: me.id, text: `${displayName(me)} acknowledged and started work` }] }
}

export function withCleanupResult(r, me, { photo, verification }) {
  if (r.status === 'cleaned') return r
  const now = Date.now()
  if (!verification.verified)
    return {
      ...r,
      attempts: [...(r.attempts || []), { by: me.id, at: now, photo, verification }],
      timeline: [...r.timeline, { type: 'rejected', at: now, by: me.id, text: `Cleanup proof from ${me.name} was not accepted by AI check` }],
    }
  return {
    ...r,
    status: 'cleaned',
    cleanup: { by: me.id, at: now, photo, verification },
    timeline: [...r.timeline, { type: 'cleaned', at: now, by: me.id, text: `Cleaned by ${displayName(me)} · AI verified the proof photo` }],
  }
}
