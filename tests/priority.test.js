import { describe, expect, it } from 'vitest'
import { priority, escalation, distanceMeters, findDuplicate, seenCount, duration } from '../src/lib/priority'

const HOUR = 3600e3
const NOW = 1_800_000_000_000
const report = (over = {}) => ({
  status: 'assigned',
  createdAt: NOW,
  seenBy: [],
  seenExtra: 0,
  ai: { severity: 5, urgency_hours: 24 },
  location: { lat: 22.5726, lng: 88.3639 },
  timeline: [],
  ...over,
})

describe('priority', () => {
  it('treats cleaned spots as done', () => {
    expect(priority(report({ status: 'cleaned' }), NOW)).toEqual({ score: 0, level: 'clean' })
  })

  it('ranks more severe spots higher', () => {
    expect(priority(report({ ai: { severity: 9 } }), NOW).score).toBeGreaterThan(priority(report({ ai: { severity: 3 } }), NOW).score)
  })

  it('raises priority as more people back a report', () => {
    const alone = priority(report(), NOW)
    const crowd = priority(report({ seenBy: ['a', 'b'], seenExtra: 20 }), NOW)
    expect(crowd.score).toBeGreaterThan(alone.score)
    expect(seenCount(report({ seenBy: ['a', 'b'], seenExtra: 20 }))).toBe(23)
  })

  it('maps scores to the public priority levels', () => {
    expect(priority(report({ ai: { severity: 2 } }), NOW).level).toBe('low')
    expect(priority(report({ ai: { severity: 10 }, seenExtra: 40 }), NOW).level).toBe('critical')
  })
})

describe('escalation', () => {
  it('is not overdue inside the AI urgency window', () => {
    expect(escalation(report(), NOW + 23 * HOUR).overdue).toBe(false)
  })

  it('escalates one level per missed window, up to the top of the chain', () => {
    expect(escalation(report(), NOW + 25 * HOUR)).toMatchObject({ overdue: true, level: 1 })
    expect(escalation(report(), NOW + 49 * HOUR).level).toBe(2)
    expect(escalation(report(), NOW + 500 * HOUR).level).toBe(2)
  })

  it('restarts the clock when an officer starts work', () => {
    const started = report({ status: 'in_progress', timeline: [{ type: 'progress', at: NOW + 20 * HOUR }] })
    expect(escalation(started, NOW + 30 * HOUR).overdue).toBe(false)
  })

  it('never escalates cleaned spots', () => {
    expect(escalation(report({ status: 'cleaned' }), NOW + 999 * HOUR).overdue).toBe(false)
  })
})

describe('distance and duplicate detection', () => {
  it('measures real-world distance', () => {
    // Howrah Bridge to Esplanade, Kolkata: roughly 2.3 km apart
    const d = distanceMeters({ lat: 22.5851, lng: 88.3468 }, { lat: 22.5646, lng: 88.3511 })
    expect(d).toBeGreaterThan(2000)
    expect(d).toBeLessThan(2600)
    expect(distanceMeters(null, { lat: 1, lng: 1 })).toBe(Infinity)
  })

  it('finds the nearest open report within 150 m', () => {
    const near = report({ id: 'near', location: { lat: 22.5727, lng: 88.3639 } })
    const nearer = report({ id: 'nearer', location: { lat: 22.57261, lng: 88.3639 } })
    const far = report({ id: 'far', location: { lat: 22.6, lng: 88.4 } })
    expect(findDuplicate({ lat: 22.5726, lng: 88.3639 }, [far, near, nearer]).r.id).toBe('nearer')
  })

  it('ignores cleaned spots and far-away reports', () => {
    const cleaned = report({ status: 'cleaned' })
    const far = report({ location: { lat: 22.6, lng: 88.4 } })
    expect(findDuplicate({ lat: 22.5726, lng: 88.3639 }, [cleaned, far])).toBeNull()
    expect(findDuplicate(null, [report()])).toBeNull()
  })
})

describe('duration', () => {
  it('reads naturally', () => {
    expect(duration(10 * 60e3)).toBe('under an hour')
    expect(duration(HOUR)).toBe('1 hour')
    expect(duration(5 * HOUR)).toBe('5 hours')
    expect(duration(72 * HOUR)).toBe('3 days')
  })
})
