import { describe, expect, it } from 'vitest'
import { pointsFor } from '../src/lib/points'
import { earnedBadgeIds, badgeProgress } from '../src/lib/badges'

const NOW = 1_800_000_000_000
const reports = [
  { createdBy: 'a', createdAt: NOW, seenBy: ['b'], status: 'assigned', ai: { severity: 4 } },
  {
    createdBy: 'b',
    createdAt: NOW,
    seenBy: [],
    status: 'cleaned',
    department: 'water',
    ai: { severity: 9, environment: 'river' },
    cleanup: { by: 'a', at: NOW + 3600e3 },
  },
]

describe('points', () => {
  it('rewards reporting, backing and especially verified cleanups', () => {
    expect(pointsFor('a', reports)).toBe(10 + 50 + 9 * 5)
    expect(pointsFor('b', reports)).toBe(2 + 10)
    expect(pointsFor('nobody', reports)).toBe(0)
  })
})

describe('badges', () => {
  it('awards the right badges for what a user did', () => {
    const got = earnedBadgeIds('a', reports)
    expect(got).toEqual(expect.arrayContaining(['first_snap', 'clean_hero', 'river_guardian', 'hazard_buster', 'speedy']))
    expect(got).not.toContain('street_sweeper')
  })

  it('tracks progress towards badges not earned yet', () => {
    expect(badgeProgress('a', reports).street_sweeper).toEqual([1, 3])
  })
})
