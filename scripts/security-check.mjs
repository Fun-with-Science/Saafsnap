// Attacks the live Supabase backend the way a malicious user could, using only the public key.
// Run: node scripts/security-check.mjs
// Creates two throwaway accounts (*@saafsnap.demo, removed by supabase/remove-demo-data.sql).
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
if (!URL_ || !KEY) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')

const results = []
const check = (name, pass, detail = '') => results.push({ name, pass, detail })

async function api(path, { token, method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(URL_ + path, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token || KEY}`,
      ...(body && !(body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}),
      Prefer: 'return=representation',
      ...headers,
    },
    body: body instanceof Uint8Array ? body : body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  return { status: res.status, data }
}

async function signup(meta) {
  const email = `sectest-${randomBytes(4).toString('hex')}@saafsnap.demo`
  const password = randomBytes(18).toString('base64url')
  const r = await api('/auth/v1/signup', { method: 'POST', body: { email, password, data: meta } })
  const token = r.data?.access_token
  const id = r.data?.user?.id
  if (!token) throw new Error('Sign-up failed: ' + JSON.stringify(r.data).slice(0, 200))
  return { token, id }
}

const rows = (r) => (Array.isArray(r.data) ? r.data.length : 0)
const blocked = (r) => r.status >= 400 || rows(r) === 0

// ── Anonymous visitor (not logged in) ──
for (const t of ['reports', 'profiles', 'contacts']) {
  check(`Anonymous visitor cannot read ${t}`, blocked(await api(`/rest/v1/${t}?select=*&limit=1`)))
}
check('Anonymous visitor cannot call actions', (await api('/rest/v1/rpc/toggle_like', { method: 'POST', body: { rid: '00000000-0000-0000-0000-000000000000' } })).status >= 400)

// ── Sign-up tricks ──
const A = await signup({ name: 'Attacker A', role: 'admin' })
const B = await signup({ name: 'Victim B', role: 'ngo', org: { name: 'Test NGO' } })
const profA = (await api(`/rest/v1/profiles?id=eq.${A.id}&select=role,status`, { token: A.token })).data?.[0]
check('Signing up with role "admin" gives a normal citizen', profA?.role === 'citizen', JSON.stringify(profA))
const profB = (await api(`/rest/v1/profiles?id=eq.${B.id}&select=role,status`, { token: B.token })).data?.[0]
check('New NGO accounts start as pending', profB?.role === 'ngo' && profB?.status === 'pending', JSON.stringify(profB))

// ── Privacy ──
const contacts = await api('/rest/v1/contacts?select=id', { token: A.token })
check("A user can only see their own email", rows(contacts) === 1 && contacts.data[0].id === A.id, `${rows(contacts)} visible`)

// ── Privilege escalation ──
await api(`/rest/v1/profiles?id=eq.${A.id}`, { token: A.token, method: 'PATCH', body: { role: 'admin', status: 'active' } })
const afterA = (await api(`/rest/v1/profiles?id=eq.${A.id}&select=role`, { token: A.token })).data?.[0]
check('A user cannot make themselves admin', afterA?.role === 'citizen', JSON.stringify(afterA))
await api(`/rest/v1/profiles?id=eq.${B.id}`, { token: A.token, method: 'PATCH', body: { status: 'active' } })
const afterB = (await api(`/rest/v1/profiles?id=eq.${B.id}&select=status`, { token: B.token })).data?.[0]
check("A user cannot approve someone else's account", afterB?.status === 'pending', JSON.stringify(afterB))

// ── Fake reports ──
const good = { lat: 22.57, lng: 88.36, ward: 1, department: 'swm', ai: { title: 'test', severity: 5, waste_types: [], hazards: [] }, landmark: 'test' }
const ownPhoto = `${URL_}/storage/v1/object/public/photos/${A.id}/x.jpg`
const tries = [
  ['as another user', { ...good, created_by: B.id, photo: ownPhoto }],
  ['already marked cleaned', { ...good, created_by: A.id, photo: ownPhoto, status: 'cleaned' }],
  ['with a fake crowd count', { ...good, created_by: A.id, photo: ownPhoto, seen_extra: 500 }],
  ['with fake likes', { ...good, created_by: A.id, photo: ownPhoto, likes: [B.id] }],
  ['with a photo from another website', { ...good, created_by: A.id, photo: 'https://evil.example/x.jpg' }],
  ['with a 500-character landmark', { ...good, created_by: A.id, photo: ownPhoto, landmark: 'x'.repeat(500) }],
  ['with malformed AI data (would crash the feed)', { ...good, created_by: A.id, photo: ownPhoto, ai: { title: 1 } }],
  ['for a made-up department', { ...good, created_by: A.id, photo: ownPhoto, department: 'fake' }],
]
for (const [label, row] of tries) {
  const r = await api('/rest/v1/reports', { token: A.token, method: 'POST', body: row })
  check(`Cannot create a report ${label}`, r.status >= 400, `HTTP ${r.status}`)
}

// ── Tampering with existing reports ──
const any = (await api('/rest/v1/reports?select=id,status,seen_extra&limit=1', { token: A.token })).data?.[0]
if (any) {
  await api(`/rest/v1/reports?id=eq.${any.id}`, { token: A.token, method: 'PATCH', body: { status: 'cleaned', seen_extra: 999 } })
  const after = (await api(`/rest/v1/reports?id=eq.${any.id}&select=status,seen_extra`, { token: A.token })).data?.[0]
  check('Cannot edit a report directly', after?.status === any.status && after?.seen_extra === any.seen_extra)
  await api(`/rest/v1/reports?id=eq.${any.id}`, { token: A.token, method: 'DELETE' })
  check('Cannot delete reports', rows(await api(`/rest/v1/reports?id=eq.${any.id}&select=id`, { token: A.token })) === 1)
  const sw = await api('/rest/v1/rpc/start_work', { token: A.token, method: 'POST', body: { rid: any.id } })
  check('Non-officers cannot mark work as started', sw.status >= 400, `HTTP ${sw.status}`)
  const sw2 = await api('/rest/v1/rpc/start_work', { token: B.token, method: 'POST', body: { rid: any.id } })
  check('Pending accounts cannot act as officers', sw2.status >= 400, `HTTP ${sw2.status}`)
  const sc = await api('/rest/v1/rpc/submit_cleanup', { token: A.token, method: 'POST', body: { rid: any.id, photo_url: 'https://evil.example/x.jpg', verification: { verified: true } } })
  check('Cannot submit cleanup proof hosted elsewhere', sc.status >= 400, `HTTP ${sc.status}`)
} else {
  check('Tampering tests need at least one report in the database', false, 'run supabase/showcase-data.sql')
}

// ── Storage ──
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
const other = await api(`/storage/v1/object/photos/${B.id}/hack.jpg`, { token: A.token, method: 'POST', body: jpeg, headers: { 'Content-Type': 'image/jpeg' } })
check("Cannot upload into someone else's photo folder", other.status >= 400, `HTTP ${other.status}`)
const html = await api(`/storage/v1/object/photos/${A.id}/page.html`, { token: A.token, method: 'POST', body: new TextEncoder().encode('<script>alert(1)</script>'), headers: { 'Content-Type': 'text/html' } })
check('Cannot upload non-image files (e.g. HTML)', html.status >= 400, `HTTP ${html.status}`)

// ── Report ──
let failed = 0
for (const r of results) {
  if (!r.pass) failed++
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  (${r.detail})`}`)
}
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
