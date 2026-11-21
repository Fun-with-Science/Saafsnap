import { DEPARTMENTS, wardFor, officerFor } from './departments'

const displayName = (user) => user.org?.name || user.name

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
