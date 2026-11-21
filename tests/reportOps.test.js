import { describe, expect, it } from 'vitest'
import { sanitizeReport, newReport, withSeen, withLike, withProgress, withCleanupResult } from '../src/lib/reportOps'

const citizen = { id: 'u1', name: 'Ananya', role: 'citizen', status: 'active' }
const other = { id: 'u2', name: 'Rahul', role: 'citizen', status: 'active' }
const officer = { id: 'g1', name: 'Officer', role: 'govt', status: 'active', org: { name: 'SWM', department: 'swm' } }
const ai = { primary_category: 'swm', severity: 6, title: 'Garbage pile' }
const base = () => newReport(citizen, { photo: 'p.jpg', location: { lat: 22.57, lng: 88.36 }, landmark: '  Park Street  ', ai }, 'r1')

describe('newReport', () => {
  it('routes to the AI-chosen department and logs the timeline', () => {
    const r = base()
    expect(r.department).toBe('swm')
    expect(r.landmark).toBe('Park Street')
    expect(r.status).toBe('assigned')
    expect(r.timeline.map((t) => t.type)).toEqual(['reported', 'ai', 'sent'])
    expect(r.timeline[2].text).toMatch(/Ward Conservancy Officer, Ward \d+/)
  })
})

describe('sanitizeReport (untrusted database rows)', () => {
  it('fills safe defaults for a malformed row', () => {
    const r = sanitizeReport({
      id: 'x',
      createdAt: 1,
      ai: { title: 1, waste_types: 'oops', severity: 'high' },
      department: 'fake',
      status: 'hacked',
      seenBy: [1, 'a'],
    })
    expect(r.ai.title).toBe('Reported spot')
    expect(r.ai.waste_types).toEqual([])
    expect(r.ai.severity).toBe(5)
    expect(r.department).toBe('swm')
    expect(r.status).toBe('assigned')
    expect(r.seenBy).toEqual(['a'])
    expect(r.location).toEqual({ lat: 22.5726, lng: 88.3639 })
  })

  it('handles a row with no AI data at all', () => {
    expect(() => sanitizeReport({ id: 'y', ai: null, timeline: 'nope' })).not.toThrow()
  })
})

describe('report actions', () => {
  it('lets others back a report once, but not the reporter', () => {
    const r = base()
    expect(withSeen(r, citizen)).toBe(r)
    const backed = withSeen(r, other)
    expect(backed.seenBy).toEqual(['u2'])
    expect(withSeen(backed, other)).toBe(backed)
  })

  it('only allows likes on cleaned spots, and toggles them', () => {
    const r = base()
    expect(withLike(r, other)).toBe(r)
    const liked = withLike({ ...r, status: 'cleaned', likes: [] }, other)
    expect(liked.likes).toEqual(['u2'])
    expect(withLike(liked, other).likes).toEqual([])
  })

  it('only lets a verified officer of the same department start work', () => {
    const r = base()
    expect(withProgress(r, citizen)).toBe(r)
    expect(withProgress(r, { ...officer, status: 'pending' })).toBe(r)
    expect(withProgress(r, { ...officer, org: { department: 'water' } })).toBe(r)
    expect(withProgress(r, officer).status).toBe('in_progress')
  })

  it('records a rejected cleanup without closing the report', () => {
    const r = withCleanupResult(base(), other, { photo: 'after.jpg', verification: { verified: false } })
    expect(r.status).toBe('assigned')
    expect(r.attempts).toHaveLength(1)
    expect(r.timeline.at(-1).type).toBe('rejected')
  })

  it('closes the report and credits the cleaner when verified', () => {
    const r = withCleanupResult(base(), other, { photo: 'after.jpg', verification: { verified: true } })
    expect(r.status).toBe('cleaned')
    expect(r.cleanup.by).toBe('u2')
    expect(withCleanupResult(r, citizen, { photo: 'x', verification: { verified: true } })).toBe(r)
  })
})
