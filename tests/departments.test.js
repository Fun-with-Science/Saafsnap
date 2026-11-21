import { describe, expect, it } from 'vitest'
import { DEPARTMENTS, DEPT_LIST, wardFor, officerFor } from '../src/lib/departments'

describe('department routing', () => {
  it('gives every department a three-step escalation chain', () => {
    expect(DEPT_LIST.length).toBeGreaterThanOrEqual(7)
    for (const d of DEPT_LIST) expect(d.escalation).toHaveLength(3)
  })

  it('assigns a stable ward between 1 and 144 for any location', () => {
    const loc = { lat: 22.5726, lng: 88.3639 }
    expect(wardFor(loc)).toBe(wardFor({ ...loc }))
    for (let i = 0; i < 50; i++) {
      const w = wardFor({ lat: 22.4 + i * 0.007, lng: 88.2 + i * 0.005 })
      expect(w).toBeGreaterThanOrEqual(1)
      expect(w).toBeLessThanOrEqual(144)
    }
    expect(wardFor(null)).toBe(1)
  })

  it('addresses the ward officer first, then escalates up the chain', () => {
    expect(officerFor('water', 33)).toBe('Environmental Engineer, Water Cell, Ward 33')
    expect(officerFor('water', 33, 1)).toBe(DEPARTMENTS.water.escalation[1])
    expect(officerFor('water', 33, 9)).toBe(DEPARTMENTS.water.escalation[2])
  })

  it('falls back to Solid Waste Management for unknown departments', () => {
    expect(officerFor('not-a-dept', 5)).toBe('Ward Conservancy Officer, Ward 5')
  })
})
