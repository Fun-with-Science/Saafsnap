import { describe, expect, it } from 'vitest'
import { normalizeAnalysis, judgeCleanup } from '../src/lib/ai'

const KOLKATA = { lat: 22.5726, lng: 88.3639 }

describe('normalizeAnalysis (guardrail on model output)', () => {
  it('keeps valid model output', () => {
    const out = normalizeAnalysis(
      {
        is_garbage_scene: true,
        title: 'Plastic on the ghat',
        primary_category: 'water',
        severity: 8,
        volume: 'Large (truck load)',
        environment: 'river',
        urgency_hours: 24,
        waste_types: ['PET bottles'],
        hazards: ['Water contamination'],
        confidence: 0.9,
      },
      KOLKATA,
      'gemini',
    )
    expect(out).toMatchObject({ primary_category: 'water', severity: 8, environment: 'river', urgency_hours: 24, source: 'gemini' })
    expect(out.officer).toMatch(/^Environmental Engineer, Water Cell, Ward \d+$/)
  })

  it('clamps or replaces anything out of range', () => {
    const out = normalizeAnalysis(
      {
        primary_category: 'aliens',
        severity: 99,
        volume: 'a lot',
        environment: 'moon',
        urgency_hours: 9999,
        confidence: 7,
        waste_types: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        title: 'x'.repeat(200),
      },
      KOLKATA,
      'gemini',
    )
    expect(out.primary_category).toBe('swm')
    expect(out.severity).toBe(10)
    expect(out.volume).toBe('Medium (handcart load)')
    expect(out.environment).toBe('other')
    expect(out.urgency_hours).toBe(240)
    expect(out.confidence).toBe(1)
    expect(out.waste_types).toHaveLength(6)
    expect(out.title.length).toBeLessThanOrEqual(80)
  })

  it('survives an empty response', () => {
    const out = normalizeAnalysis({}, null, 'demo')
    expect(out).toMatchObject({ is_garbage_scene: false, primary_category: 'swm', severity: 5, urgency_hours: 48 })
  })
})

describe('judgeCleanup (is the cleanup proof real?)', () => {
  const NOW = 1_800_000_000_000
  const report = { createdAt: NOW - 24 * 3600e3, location: KOLKATA }
  const goodAi = {
    same_location_likely: true,
    is_clean: true,
    cleanliness_score: 85,
    ai_generated_likelihood: 0.1,
    looks_like_screenshot_or_stock: false,
    notes: 'Looks clean.',
  }
  const camera = { make: 'Samsung', model: 'Galaxy', lat: 22.57262, lng: 88.36392, takenAt: NOW - 3600e3 }

  it('accepts a fresh, clean camera photo from the same spot', () => {
    const v = judgeCleanup({ ai: goodAi, exif: camera, report, now: NOW })
    expect(v.verified).toBe(true)
    expect(v.checks.every((c) => c.pass)).toBe(true)
  })

  it('rejects a photo taken far away', () => {
    const v = judgeCleanup({ ai: goodAi, exif: { ...camera, lat: 22.7, lng: 88.5 }, report, now: NOW })
    expect(v.verified).toBe(false)
    expect(v.checks.find((c) => c.id === 'place').pass).toBe(false)
  })

  it('rejects a spot that still looks dirty', () => {
    const v = judgeCleanup({ ai: { ...goodAi, is_clean: false, cleanliness_score: 30 }, exif: camera, report, now: NOW })
    expect(v.verified).toBe(false)
    expect(v.notes).toMatch(/still looks dirty/)
  })

  it('rejects a photo taken before the complaint', () => {
    const v = judgeCleanup({ ai: goodAi, exif: { ...camera, takenAt: NOW - 10 * 24 * 3600e3 }, report, now: NOW })
    expect(v.checks.find((c) => c.id === 'fresh').pass).toBe(false)
  })

  it('rejects AI-generated or stock images', () => {
    const fake = judgeCleanup({ ai: { ...goodAi, ai_generated_likelihood: 0.9 }, exif: null, here: KOLKATA, report, now: NOW })
    expect(fake.verified).toBe(false)
    expect(fake.notes).toMatch(/AI-made/)
    const stock = judgeCleanup({ ai: { ...goodAi, looks_like_screenshot_or_stock: true }, exif: camera, report, now: NOW })
    expect(stock.verified).toBe(false)
  })

  it('uses the phone location when the photo has no GPS', () => {
    const v = judgeCleanup({ ai: goodAi, exif: { make: 'Apple' }, here: { lat: 22.57265, lng: 88.3639 }, report, now: NOW })
    expect(v.verified).toBe(true)
  })
})
