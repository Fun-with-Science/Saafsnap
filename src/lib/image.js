// Decodes a data: URL locally (fetch() on data: URLs is blocked by the site's security policy).
export function dataUrlToBlob(dataUrl) {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read this image. Try a JPG or PNG photo.'))
    img.src = src
  })
}

export async function fileToDataUrl(file, maxDim = 960, quality = 0.72) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return drawToJpeg(img, maxDim, quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function drawToJpeg(img, maxDim, quality) {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height))
  const w = Math.round((img.naturalWidth || img.width) * scale)
  const h = Math.round((img.naturalHeight || img.height) * scale)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/jpeg', quality)
}

export async function toJpegDataUrl(dataUrl, maxDim = 1024) {
  if (dataUrl.startsWith('data:image/jpeg')) return dataUrl
  return drawToJpeg(await loadImage(dataUrl), maxDim, 0.8)
}

export async function readExif(file) {
  try {
    const { default: exifr } = await import('exifr')
    const d = await exifr.parse(file, { gps: true })
    if (!d) return {}
    const taken = d.DateTimeOriginal || d.CreateDate
    return {
      make: d.Make || null,
      model: d.Model || null,
      software: d.Software || null,
      takenAt: taken ? new Date(taken).getTime() : null,
      lat: typeof d.latitude === 'number' ? d.latitude : null,
      lng: typeof d.longitude === 'number' ? d.longitude : null,
    }
  } catch {
    return {}
  }
}

// 'granted' | 'prompt' | 'denied' | 'unsupported'. Browsers without the Permissions API report 'prompt'.
export async function locationPermission() {
  if (!navigator.geolocation) return 'unsupported'
  try {
    const p = await navigator.permissions?.query({ name: 'geolocation' })
    return p?.state || 'prompt'
  } catch {
    return 'prompt'
  }
}

export function getPosition(timeout = 9000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    )
  })
}

// Small colour/texture fingerprint used by the offline demo analyser.
export async function imageStats(dataUrl) {
  const img = await loadImage(dataUrl)
  const W = 96
  const H = 72
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)
  const lum = new Float32Array(W * H)
  const hist = new Float32Array(64)
  let blue = 0, green = 0, brown = 0, dark = 0, satSum = 0, hash = 0
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4] / 255
    const g = data[i * 4 + 1] / 255
    const b = data[i * 4 + 2] / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const v = max
    const s = max === 0 ? 0 : (max - min) / max
    let h = 0
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min)) % 6
      else if (max === g) h = (b - r) / (max - min) + 2
      else h = (r - g) / (max - min) + 4
      h *= 60
      if (h < 0) h += 360
    }
    satSum += s
    if (v < 0.25) dark++
    if (s > 0.2 && v > 0.25) {
      if (h >= 175 && h <= 250) blue++
      else if (h >= 75 && h < 175) green++
      else if (h >= 15 && h < 50 && v < 0.75) brown++
    }
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b
    const bin = (Math.min(3, Math.floor(r * 4)) << 4) | (Math.min(3, Math.floor(g * 4)) << 2) | Math.min(3, Math.floor(b * 4))
    hist[bin]++
  }
  let edges = 0
  for (let y = 0; y < H - 1; y++)
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x
      if (Math.abs(lum[i] - lum[i + 1]) + Math.abs(lum[i] - lum[i + W]) > 0.16) edges++
    }
  const n = W * H
  for (let i = 0; i < 64; i++) {
    hist[i] /= n
    hash = (hash * 31 + Math.round(hist[i] * 1000)) >>> 0
  }
  return {
    blue: blue / n,
    green: green / n,
    brown: brown / n,
    dark: dark / n,
    sat: satSum / n,
    edges: edges / ((W - 1) * (H - 1)),
    hist: Array.from(hist),
    hash,
  }
}

export function histSimilarity(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += Math.min(a[i], b[i])
  return s
}
