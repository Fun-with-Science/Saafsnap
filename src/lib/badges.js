import { Camera, Bird, Megaphone, ShieldCheck, Brush, Waves, Shield, Zap } from 'lucide-react'

export const BADGES = [
  { id: 'first_snap', name: 'First Snap', icon: Camera, desc: 'Reported your first spot', color: '#0ea5e9' },
  { id: 'eagle_eye', name: 'Eagle Eye', icon: Bird, desc: 'Reported 5 spots', color: '#8b5cf6' },
  { id: 'crowd_voice', name: 'Crowd Voice', icon: Megaphone, desc: 'Backed 5 reports with "I saw this too"', color: '#f59e0b' },
  { id: 'clean_hero', name: 'Clean Hero', icon: ShieldCheck, desc: 'Completed your first verified cleanup', color: '#10b981' },
  { id: 'street_sweeper', name: 'Street Sweeper', icon: Brush, desc: '3 verified cleanups', color: '#f97316' },
  { id: 'river_guardian', name: 'River Guardian', icon: Waves, desc: 'Cleaned a river, pond or canal', color: '#06b6d4' },
  { id: 'hazard_buster', name: 'Hazard Buster', icon: Shield, desc: 'Cleaned a severity 8+ spot', color: '#e11d48' },
  { id: 'speedy', name: 'Speedy Response', icon: Zap, desc: 'Cleaned a spot within 48h of the report', color: '#eab308' },
]

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]))

const WATER_ENVS = ['river', 'pond', 'drain']

export function badgeProgress(userId, reports) {
  const mine = reports.filter((r) => r.createdBy === userId).length
  const backed = reports.filter((r) => r.seenBy?.includes(userId)).length
  const cleaned = reports.filter((r) => r.status === 'cleaned' && r.cleanup?.by === userId)
  return {
    first_snap: [Math.min(mine, 1), 1],
    eagle_eye: [Math.min(mine, 5), 5],
    crowd_voice: [Math.min(backed, 5), 5],
    clean_hero: [Math.min(cleaned.length, 1), 1],
    street_sweeper: [Math.min(cleaned.length, 3), 3],
    river_guardian: [cleaned.some((r) => WATER_ENVS.includes(r.ai?.environment) || r.department === 'water') ? 1 : 0, 1],
    hazard_buster: [cleaned.some((r) => (r.ai?.severity || 0) >= 8) ? 1 : 0, 1],
    speedy: [cleaned.some((r) => r.cleanup.at - r.createdAt <= 48 * 3600e3) ? 1 : 0, 1],
  }
}

export function earnedBadgeIds(userId, reports) {
  const p = badgeProgress(userId, reports)
  return BADGES.filter((b) => p[b.id][0] >= p[b.id][1]).map((b) => b.id)
}
