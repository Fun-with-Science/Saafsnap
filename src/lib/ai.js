import { DEPARTMENTS, DEPT_LIST, officerFor, wardFor } from './departments'
import { imageStats, histSimilarity, toJpegDataUrl } from './image'
import { distanceMeters } from './priority'

const KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite'
// Flash-lite answers in seconds; the bigger models are often overloaded, so they are only backups.
const MODELS = [...new Set([MODEL, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'])]
export const AI_MODE = KEY ? 'gemini' : 'demo'

const CATEGORIES = Object.keys(DEPARTMENTS)
const VOLUMES = ['Small (a few bags)', 'Medium (handcart load)', 'Large (truck load)', 'Massive (multiple trucks)']
const ENVS = ['road', 'river', 'pond', 'drain', 'market', 'park', 'residential', 'other']

async function imagePart(dataUrl) {
  const jpeg = await toJpegDataUrl(dataUrl)
  return { inlineData: { mimeType: 'image/jpeg', data: jpeg.split(',')[1] } }
}

async function callModel(model, parts, schema) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
      }),
    })
    if (!res.ok) throw new Error(`Gemini request failed (${res.status})`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || '').join('')
    if (!text) throw new Error('Gemini returned an empty answer')
    return JSON.parse(text)
  } catch (err) {
    throw err.name === 'AbortError' ? new Error('Gemini took too long') : err
  } finally {
    clearTimeout(timer)
  }
}

// Busy or retired models are common, so walk down a short list before giving up.
async function callGemini(parts, schema) {
  let lastErr
  for (const model of MODELS) {
    try {
      return await callModel(model, parts, schema)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

const ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_garbage_scene: { type: 'BOOLEAN', description: 'True only if the photo really shows litter, dumped waste, sewage or a polluted water body' },
    title: { type: 'STRING', description: 'Plain-language headline, at most 8 words' },
    summary: { type: 'STRING', description: 'One or two sentences describing what is visible' },
    waste_types: { type: 'ARRAY', items: { type: 'STRING' } },
    primary_category: { type: 'STRING', enum: CATEGORIES },
    severity: { type: 'INTEGER', description: '1 (minor litter) to 10 (dangerous, large or hazardous)' },
    volume: { type: 'STRING', enum: VOLUMES },
    hazards: { type: 'ARRAY', items: { type: 'STRING' } },
    environment: { type: 'STRING', enum: ENVS },
    recommended_action: { type: 'STRING' },
    urgency_hours: { type: 'INTEGER', description: 'Hours within which the department should clean it' },
    complaint_text: { type: 'STRING', description: 'Short, polite formal complaint addressed to the officer' },
    confidence: { type: 'NUMBER', description: '0 to 1' },
  },
  required: ['is_garbage_scene', 'title', 'summary', 'waste_types', 'primary_category', 'severity', 'volume', 'hazards', 'environment', 'recommended_action', 'urgency_hours', 'complaint_text', 'confidence'],
}

const VERIFY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    same_location_likely: { type: 'BOOLEAN' },
    is_clean: { type: 'BOOLEAN' },
    cleanliness_score: { type: 'INTEGER', description: '0 (still dirty) to 100 (spotless)' },
    ai_generated_likelihood: { type: 'NUMBER', description: '0 to 1 likelihood the AFTER photo is AI-generated, edited or not a real camera photo' },
    looks_like_screenshot_or_stock: { type: 'BOOLEAN' },
    notes: { type: 'STRING', description: 'One short sentence explaining the decision to the user' },
  },
  required: ['same_location_likely', 'is_clean', 'cleanliness_score', 'ai_generated_likelihood', 'looks_like_screenshot_or_stock', 'notes'],
}

function normalize(raw, location, source) {
  const cat = CATEGORIES.includes(raw.primary_category) ? raw.primary_category : 'swm'
  const ward = wardFor(location)
  return {
    source,
    is_garbage_scene: !!raw.is_garbage_scene,
    title: String(raw.title || 'Garbage spotted').slice(0, 80),
    summary: String(raw.summary || ''),
    waste_types: (raw.waste_types || []).slice(0, 6).map(String),
    primary_category: cat,
    severity: Math.max(1, Math.min(10, Math.round(raw.severity || 5))),
    volume: VOLUMES.includes(raw.volume) ? raw.volume : VOLUMES[1],
    hazards: (raw.hazards || []).slice(0, 4).map(String),
    environment: ENVS.includes(raw.environment) ? raw.environment : 'other',
    recommended_action: String(raw.recommended_action || ''),
    urgency_hours: Math.max(6, Math.min(240, Math.round(raw.urgency_hours || 48))),
    complaint_text: String(raw.complaint_text || ''),
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0.7)),
    officer: officerFor(cat, ward),
  }
}

export async function analyzeReport(dataUrl, { location, landmark } = {}) {
  if (KEY) {
    try {
      const where = location
        ? `GPS ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}${location.accuracy ? ` (accurate to about ${Math.round(location.accuracy)} m)` : ''}, ${location.source === 'manual' ? 'pinned on a map by the citizen' : 'from the citizen\'s phone'}`
        : 'location unknown'
      const prompt = `You are SaafSnap, a civic waste inspector for Indian cities. A citizen photographed this spot${landmark ? ` ("${landmark}")` : ''}. Location: ${where}.
Use the location as context: if you recognise the area (for example a riverbank, ghat, canal, market or main road), let it inform the department, severity and urgency, and name the area in the summary and complaint. Do not invent a street address you are not sure of.
Decide if it shows real litter, dumped waste, sewage or a polluted water body. If not (selfie, food, clean street, screenshot), set is_garbage_scene=false.
Pick the ONE department responsible:
${DEPT_LIST.map((d) => `- ${d.id}: ${d.name} — ${d.covers}`).join('\n')}
Hazardous or medical items outrank general waste. Water bodies go to "water" unless it is a street drain ("drainage").
Write complaint_text addressed to the officer of the department you picked (ward ${wardFor(location)}) in under 90 words: mention the landmark or area, include the GPS coordinates so the crew can find the spot, state the risks, and ask for cleanup within urgency_hours.`
      const raw = await callGemini([{ text: prompt }, await imagePart(dataUrl)], ANALYSIS_SCHEMA)
      return normalize(raw, location, 'gemini')
    } catch (err) {
      const demo = await demoAnalyze(dataUrl, location, landmark)
      return { ...demo, fallbackReason: err.message }
    }
  }
  return demoAnalyze(dataUrl, location, landmark)
}

const WASTE_BY_CAT = {
  swm: ['Plastic bags', 'Food waste', 'Paper cups', 'Wrappers', 'Cardboard', 'Cloth'],
  water: ['Floating plastic', 'PET bottles', 'Thermocol', 'Flower offerings', 'Sludge'],
  drainage: ['Silt', 'Plastic bags', 'Sewage', 'Food waste'],
  construction: ['Broken bricks', 'Cement bags', 'Sand', 'Tiles'],
  hazardous: ['Batteries', 'Old electronics', 'Paint cans'],
  health: ['Used masks', 'Syringes', 'Gloves'],
  animal: ['Animal waste'],
}
const HAZ_BY_CAT = {
  swm: ['Foul smell', 'Stray animals', 'Flies and disease'],
  water: ['Water contamination', 'Harm to aquatic life'],
  drainage: ['Waterlogging', 'Mosquito breeding'],
  construction: ['Road accident risk', 'Dust'],
  hazardous: ['Toxic leakage', 'Soil contamination'],
  health: ['Infection risk', 'Needle-stick injury'],
  animal: ['Infection risk'],
}
const TITLE_BY_CAT = {
  swm: 'Garbage heap dumped in public',
  water: 'Waste polluting the water body',
  drainage: 'Drain choked with waste',
  construction: 'Construction debris dumped',
  hazardous: 'Hazardous waste left in the open',
  health: 'Medical waste left in the open',
  animal: 'Animal waste on the roadside',
}

async function demoAnalyze(dataUrl, location, landmark) {
  await new Promise((r) => setTimeout(r, 1600))
  const s = await imageStats(dataUrl)
  let cat = 'swm'
  let env = ['road', 'market', 'residential', 'road'][s.hash % 4]
  if (s.blue > 0.22) {
    cat = 'water'
    env = s.hash % 2 ? 'river' : 'pond'
  } else if (s.dark > 0.32 && s.green > 0.08) {
    cat = 'drainage'
    env = 'drain'
  } else if (s.brown > 0.28 && s.sat < 0.35) {
    cat = 'construction'
    env = 'road'
  } else if (s.green > 0.35) {
    env = 'park'
  }
  const severity = Math.max(2, Math.min(9, Math.round(2.5 + s.edges * 28 + s.sat * 3)))
  const volIdx = severity >= 8 ? 2 : severity >= 5 ? 1 : 0
  const pool = WASTE_BY_CAT[cat]
  const n = 2 + (s.hash % 3)
  const waste = Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[(s.hash + i) % pool.length])
  const ward = wardFor(location)
  const urgency = severity >= 8 ? 24 : severity >= 5 ? 48 : 72
  const gps = location ? ` (GPS ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)})` : ''
  const place = (landmark || 'the reported location') + gps
  const raw = {
    is_garbage_scene: s.edges > 0.025,
    title: TITLE_BY_CAT[cat],
    summary: `${waste.join(', ')} visible${landmark ? ` (${landmark})` : ''}.`,
    waste_types: waste,
    primary_category: cat,
    severity,
    volume: VOLUMES[volIdx],
    hazards: HAZ_BY_CAT[cat].slice(0, 2),
    environment: env,
    recommended_action: `Send a ${['two-person team', 'handcart crew', 'tipper truck and crew'][volIdx]} and segregate the waste before disposal.`,
    urgency_hours: urgency,
    complaint_text: `To the ${officerFor(cat, ward)}, ${DEPARTMENTS[cat].name}:\n\nA citizen has reported ${TITLE_BY_CAT[cat].toLowerCase()} at ${place} (severity ${severity}/10). Risks: ${HAZ_BY_CAT[cat].slice(0, 2).join(', ').toLowerCase()}. Kindly arrange cleanup within ${urgency} hours and upload proof on SaafSnap.\n\nThank you.`,
    confidence: 0.62,
  }
  return normalize(raw, location, 'demo')
}

// Combines the model's opinion with hard signals (EXIF camera data, GPS distance, photo date).
export async function verifyCleanup({ beforeUrl, afterUrl, exif, here, report }) {
  let ai
  let source = 'demo'
  if (KEY) {
    try {
      const prompt = `You verify cleanup proof for SaafSnap. Image 1 is the BEFORE photo of a reported garbage spot. Image 2 is the AFTER photo a volunteer uploaded.
Judge: is image 2 plausibly the same place (same landmarks/angle may differ)? Is the waste now removed? Does image 2 look AI-generated, heavily edited, a screenshot or a stock photo? Be strict but fair. Note: image 1 may be an illustration in demo data; then judge location loosely and focus on cleanliness and authenticity.`
      ai = await callGemini([{ text: prompt }, await imagePart(beforeUrl), await imagePart(afterUrl)], VERIFY_SCHEMA)
      source = 'gemini'
    } catch {
      ai = null
    }
  }
  if (!ai) ai = await demoVerify(beforeUrl, afterUrl, exif)

  const hasCamera = !!(exif?.make || exif?.model)
  const gps = exif?.lat != null ? { lat: exif.lat, lng: exif.lng } : here
  const dist = gps ? distanceMeters(gps, report.location) : null
  const nearby = dist != null && dist <= 400
  const fresh = exif?.takenAt ? exif.takenAt >= report.createdAt - 3600e3 && exif.takenAt <= Date.now() + 3600e3 : null

  const checks = [
    {
      id: 'real',
      label: 'Real camera photo, not AI-made',
      pass: ai.ai_generated_likelihood < (hasCamera ? 0.7 : 0.5) && !ai.looks_like_screenshot_or_stock,
      detail: hasCamera ? `Camera: ${[exif.make, exif.model].filter(Boolean).join(' ')}` : 'No camera info in the file, checked visually',
    },
    {
      id: 'place',
      label: 'Same place as the report',
      pass: nearby || (dist == null || dist < 3000 ? ai.same_location_likely : false),
      detail: dist != null ? `${dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(1) + ' km'} from the reported spot` : 'Location unavailable, compared the scene instead',
    },
    {
      id: 'clean',
      label: 'Area now looks clean',
      pass: ai.is_clean && ai.cleanliness_score >= 60,
      detail: `Cleanliness score ${ai.cleanliness_score}/100`,
    },
    {
      id: 'fresh',
      label: 'Photo taken after the report',
      pass: fresh !== false,
      detail: exif?.takenAt ? `Taken ${new Date(exif.takenAt).toLocaleString()}` : 'No date in file, accepted',
    },
  ]
  const FAIL_HINT = {
    real: 'This looks AI-made, edited or downloaded. Please take a real photo with your camera.',
    place: "We couldn't match this to the reported spot. Stand where the original was taken and turn on location.",
    clean: 'The spot still looks dirty. Finish the cleanup and try again.',
    fresh: 'This photo was taken before the complaint. Please take a fresh one.',
  }
  const failed = checks.find((c) => !c.pass)
  return {
    verified: !failed,
    checks,
    cleanliness: ai.cleanliness_score,
    notes: failed ? FAIL_HINT[failed.id] : ai.notes,
    source,
  }
}

async function demoVerify(beforeUrl, afterUrl, exif) {
  await new Promise((r) => setTimeout(r, 1800))
  const [a, b] = await Promise.all([imageStats(beforeUrl), imageStats(afterUrl)])
  const sim = histSimilarity(a.hist, b.hist)
  const clutterDrop = (a.edges - b.edges) / Math.max(a.edges, 0.01)
  const score = Math.max(0, Math.min(100, Math.round(55 + clutterDrop * 90)))
  const identical = sim > 0.97 && Math.abs(a.edges - b.edges) < 0.004
  const hasCamera = !!(exif?.make || exif?.model)
  return {
    same_location_likely: sim > 0.35,
    is_clean: !identical && score >= 60,
    cleanliness_score: identical ? 20 : score,
    ai_generated_likelihood: hasCamera ? 0.05 : b.edges < 0.003 ? 0.65 : 0.3,
    looks_like_screenshot_or_stock: false,
    notes: identical
      ? 'This looks like the same photo as before, so nothing changed.'
      : score >= 60
        ? 'Less clutter is visible than in the original photo.'
        : 'The area still looks cluttered compared to the original photo.',
  }
}
