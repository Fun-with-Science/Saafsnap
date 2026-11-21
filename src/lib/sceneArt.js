// Illustrated placeholder photos for the seeded demo reports.
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
}

const BAG_COLORS = ['#1f2937', '#334155', '#2563eb', '#f8fafc', '#16a34a', '#0f172a', '#dc2626']
const BOTTLE_COLORS = ['#7dd3fc', '#a7f3d0', '#fde68a', '#bae6fd', '#e2e8f0']
const WRAP_COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#22c55e', '#ec4899', '#facc15']

function pile(r, cx, cy, n, spread, scale = 1) {
  let out = ''
  const items = []
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI
    const d = Math.pow(r(), 0.7) * spread
    items.push({ x: cx + Math.cos(a * 2) * d, y: cy - Math.abs(Math.sin(a)) * d * 0.35 + r() * 10, t: r() })
  }
  items.sort((a, b) => a.y - b.y)
  for (const it of items) {
    const s = (0.7 + r() * 0.6) * scale
    if (it.t < 0.5) {
      const c = BAG_COLORS[Math.floor(r() * BAG_COLORS.length)]
      out += `<g transform="translate(${it.x} ${it.y}) scale(${s}) rotate(${(r() - 0.5) * 30})">
        <ellipse cx="0" cy="0" rx="34" ry="26" fill="${c}" stroke="#0f172a" stroke-width="3"/>
        <path d="M-8 -24 L0 -38 L8 -24" fill="${c}" stroke="#0f172a" stroke-width="3"/>
        <path d="M-18 -6 Q0 4 16 -10" stroke="rgba(255,255,255,.35)" stroke-width="4" fill="none"/></g>`
    } else if (it.t < 0.78) {
      const c = BOTTLE_COLORS[Math.floor(r() * BOTTLE_COLORS.length)]
      out += `<g transform="translate(${it.x} ${it.y}) scale(${s}) rotate(${(r() - 0.5) * 160})">
        <rect x="-9" y="-26" width="18" height="40" rx="7" fill="${c}" stroke="#0f172a" stroke-width="3"/>
        <rect x="-5" y="-34" width="10" height="10" rx="2" fill="#ef4444" stroke="#0f172a" stroke-width="3"/></g>`
    } else {
      const c = WRAP_COLORS[Math.floor(r() * WRAP_COLORS.length)]
      out += `<g transform="translate(${it.x} ${it.y}) scale(${s}) rotate(${r() * 360})">
        <path d="M-16 -8 L14 -12 L18 8 L-12 12 Z" fill="${c}" stroke="#0f172a" stroke-width="3"/></g>`
    }
  }
  return out
}

function flies(r, cx, cy) {
  let out = ''
  for (let i = 0; i < 6; i++) {
    const x = cx + (r() - 0.5) * 220
    const y = cy - 60 - r() * 90
    out += `<circle cx="${x}" cy="${y}" r="3.5" fill="#0f172a"/><path d="M${x - 6} ${y - 4} q6 -6 12 0" stroke="#0f172a" stroke-width="1.5" fill="none" opacity=".6"/>`
  }
  return out
}

function flowers(r, y0, y1, n) {
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = 30 + r() * 740
    const y = y0 + r() * (y1 - y0)
    const c = WRAP_COLORS[Math.floor(r() * WRAP_COLORS.length)]
    out += `<g transform="translate(${x} ${y})"><path d="M0 0 v18" stroke="#15803d" stroke-width="3"/>
      <circle r="7" fill="${c}" stroke="#0f172a" stroke-width="2"/><circle r="2.5" fill="#fde047"/></g>`
  }
  return out
}

function sparkles(r) {
  let out = ''
  for (let i = 0; i < 5; i++) {
    const x = 80 + r() * 640
    const y = 120 + r() * 300
    const s = 0.6 + r() * 0.8
    out += `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5 Z" fill="#fff" stroke="#0f172a" stroke-width="2.5"/>`
  }
  return out
}

function sky(top, bottom) {
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <rect width="800" height="600" fill="url(#sky)"/>
    <circle cx="660" cy="90" r="42" fill="#fde047" stroke="#0f172a" stroke-width="3"/>`
}

function buildings(r, baseY) {
  let out = ''
  let x = -10
  const tones = ['#fca5a5', '#fdba74', '#c4b5fd', '#93c5fd', '#fcd34d', '#86efac']
  while (x < 810) {
    const w = 70 + r() * 70
    const h = 90 + r() * 120
    const c = tones[Math.floor(r() * tones.length)]
    out += `<rect x="${x}" y="${baseY - h}" width="${w}" height="${h}" fill="${c}" stroke="#0f172a" stroke-width="3"/>`
    for (let wy = baseY - h + 16; wy < baseY - 24; wy += 30)
      for (let wx = x + 12; wx < x + w - 18; wx += 26)
        out += `<rect x="${wx}" y="${wy}" width="12" height="14" fill="#fff7ed" stroke="#0f172a" stroke-width="2"/>`
    x += w - 3
  }
  return out
}

function trees(r, baseY, n) {
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = 40 + r() * 720
    const s = 0.8 + r() * 0.6
    out += `<g transform="translate(${x} ${baseY}) scale(${s})"><rect x="-6" y="-40" width="12" height="42" fill="#a16207" stroke="#0f172a" stroke-width="3"/>
      <circle cx="0" cy="-62" r="34" fill="#22c55e" stroke="#0f172a" stroke-width="3"/></g>`
  }
  return out
}

const SCENES = {
  road(r, dirty) {
    return `${sky('#bae6fd', '#e0f2fe')}${buildings(r, 300)}
      <rect y="300" width="800" height="70" fill="#e7e5e4" stroke="#0f172a" stroke-width="3"/>
      <rect y="370" width="800" height="230" fill="#57534e"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${i * 180 + 20}" y="480" width="100" height="14" rx="7" fill="#fafaf9"/>`).join('')}
      ${dirty ? pile(r, 400, 350, 26, 210) + flies(r, 400, 350) : flowers(r, 312, 352, 10) + sparkles(r)}`
  },
  market(r, dirty) {
    const awn = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6']
    let stalls = ''
    for (let i = 0; i < 4; i++) {
      const x = 20 + i * 195
      const c = awn[i]
      stalls += `<rect x="${x}" y="200" width="175" height="130" fill="#fef3c7" stroke="#0f172a" stroke-width="3"/>
        <path d="M${x - 8} 200 L${x + 183} 200 L${x + 170} 160 L${x + 5} 160 Z" fill="${c}" stroke="#0f172a" stroke-width="3"/>
        ${[0, 1, 2].map((k) => `<circle cx="${x + 40 + k * 48}" cy="300" r="16" fill="${awn[(i + k + 1) % 4]}" stroke="#0f172a" stroke-width="3"/>`).join('')}`
    }
    return `${sky('#fde68a', '#fef9c3')}${stalls}<rect y="330" width="800" height="270" fill="#a8a29e"/>
      ${dirty ? pile(r, 400, 430, 32, 260) + flies(r, 400, 430) : sparkles(r)}`
  },
  river(r, dirty) {
    const water = dirty ? '#5b7f6b' : '#38bdf8'
    let waves = ''
    for (let i = 0; i < 7; i++) {
      const y = 330 + i * 38
      waves += `<path d="M0 ${y} q50 -14 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0" stroke="rgba(255,255,255,.5)" stroke-width="4" fill="none"/>`
    }
    let floaters = ''
    if (dirty) {
      for (let i = 0; i < 4; i++) floaters += pile(r, 120 + r() * 560, 360 + r() * 200, 6, 60, 0.8)
    }
    return `${sky('#bfdbfe', '#eff6ff')}<path d="M0 250 Q200 220 400 250 T800 245 V300 H0 Z" fill="#4ade80" stroke="#0f172a" stroke-width="3"/>
      ${trees(r, 270, 5)}
      <rect y="295" width="800" height="305" fill="${water}" stroke="#0f172a" stroke-width="3"/>${waves}
      <path d="M0 520 L260 470 L300 600 L0 600 Z" fill="#d6d3d1" stroke="#0f172a" stroke-width="3"/>
      ${dirty ? floaters + pile(r, 130, 520, 14, 110) : sparkles(r)}`
  },
  pond(r, dirty) {
    const water = dirty ? '#6b8f5e' : '#38bdf8'
    return `${sky('#cffafe', '#ecfeff')}${trees(r, 230, 6)}
      <rect y="220" width="800" height="380" fill="#4ade80"/>
      <ellipse cx="400" cy="420" rx="330" ry="140" fill="${water}" stroke="#0f172a" stroke-width="4"/>
      <ellipse cx="320" cy="390" rx="90" ry="14" fill="rgba(255,255,255,.35)"/>
      ${dirty ? pile(r, 400, 420, 22, 230, 0.8) + pile(r, 160, 300, 8, 60) : flowers(r, 240, 280, 12) + sparkles(r)}`
  },
  drain(r, dirty) {
    const water = dirty ? '#3f4b3a' : '#7dd3fc'
    return `${sky('#e2e8f0', '#f8fafc')}${buildings(r, 240)}
      <rect y="240" width="800" height="360" fill="#a8a29e"/>
      <path d="M220 240 L580 240 L700 600 L100 600 Z" fill="#78716c" stroke="#0f172a" stroke-width="3"/>
      <path d="M260 260 L540 260 L640 600 L160 600 Z" fill="${water}" stroke="#0f172a" stroke-width="3"/>
      ${dirty ? pile(r, 400, 470, 26, 170) + flies(r, 400, 470) : sparkles(r)}`
  },
  park(r, dirty) {
    return `${sky('#bbf7d0', '#f0fdf4')}${trees(r, 290, 7)}
      <rect y="280" width="800" height="320" fill="#4ade80"/>
      <path d="M300 600 Q380 420 470 280 L520 280 Q450 420 420 600 Z" fill="#fde68a" stroke="#0f172a" stroke-width="3"/>
      <rect x="560" y="360" width="150" height="16" fill="#a16207" stroke="#0f172a" stroke-width="3"/>
      ${dirty ? pile(r, 230, 440, 18, 140) + pile(r, 620, 470, 10, 80) : flowers(r, 300, 560, 22) + sparkles(r)}`
  },
}

export function sceneArt(kind, dirty, seed = 1) {
  const r = rng(seed * 31 + (dirty ? 7 : 3))
  const body = (SCENES[kind] || SCENES.road)(r, dirty)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">${body}</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
