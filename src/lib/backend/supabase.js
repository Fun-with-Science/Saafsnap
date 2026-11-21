// Shared, multi-device storage. Run supabase/setup.sql once before using it.
import { createClient } from '@supabase/supabase-js'
import { buildSeedReports, USERS } from '../seed'
import { newId } from '../auth'
import { newReport } from '../reportOps'

const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseConfigured = !!(SB_URL && SB_KEY)
const sb = supabaseConfigured ? createClient(SB_URL, SB_KEY) : null

function must({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

const toUser = (p, emails) => ({
  id: p.id,
  name: p.name,
  role: p.role,
  status: p.status,
  org: p.org,
  createdAt: Date.parse(p.created_at),
  email: emails[p.id] || null,
})

const toReport = (r) => ({
  id: r.id,
  createdBy: r.created_by,
  createdAt: Date.parse(r.created_at),
  photo: r.photo,
  location: { lat: r.lat, lng: r.lng },
  landmark: r.landmark,
  ward: r.ward,
  department: r.department,
  ai: r.ai,
  exif: r.exif,
  seenBy: r.seen_by || [],
  seenExtra: r.seen_extra,
  status: r.status,
  timeline: r.timeline || [],
  cleanup: r.cleanup,
  attempts: r.attempts || [],
})

const toRow = (r) => ({
  created_by: r.createdBy,
  created_at: new Date(r.createdAt).toISOString(),
  photo: r.photo,
  lat: r.location.lat,
  lng: r.location.lng,
  landmark: r.landmark,
  ward: r.ward,
  department: r.department,
  ai: r.ai,
  exif: r.exif,
  seen_by: r.seenBy,
  seen_extra: r.seenExtra,
  status: r.status,
  timeline: r.timeline,
  cleanup: r.cleanup,
  attempts: r.attempts,
})

async function uploadPhoto(dataUrl, uid) {
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${uid}/${newId()}.jpg`
  must(await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' }))
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl
}

async function load() {
  const [p, r, c] = await Promise.all([
    sb.from('profiles').select('*'),
    sb.from('reports').select('*').order('created_at', { ascending: false }),
    sb.from('contacts').select('*'),
  ])
  const emails = Object.fromEntries(must(c).map((x) => [x.id, x.email]))
  return { users: must(p).map((x) => toUser(x, emails)), reports: must(r).map(toReport) }
}

export const supabaseBackend = {
  mode: 'supabase',

  async init() {
    const { data } = await sb.auth.getSession()
    const sessionId = data.session?.user.id || null
    const d = sessionId ? await load() : { users: [], reports: [] }
    return { ...d, sessionId }
  },

  load,

  async signup({ name, email, password, role, org }) {
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { data: { name, role, org } } })
    if (error) throw new Error(/registered/i.test(error.message) ? 'An account with this email already exists.' : error.message)
    if (data.user && data.user.identities?.length === 0) throw new Error('An account with this email already exists.')
    return { userId: data.session ? data.user.id : null, needsConfirm: !data.session }
  },

  async login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Wrong email or password.' : error.message)
    const prof = must(await sb.from('profiles').select('status').eq('id', data.user.id).single())
    if (prof.status === 'rejected') {
      await sb.auth.signOut()
      throw new Error('This account was not approved. Contact the SaafSnap team.')
    }
    return data.user.id
  },

  async logout() {
    await sb.auth.signOut()
  },

  async createReport(me, input) {
    const photo = await uploadPhoto(input.photo, me.id)
    const { created_at, ...row } = toRow(newReport(me, { ...input, photo }))
    return toReport(must(await sb.from('reports').insert(row).select().single()))
  },

  async back(_me, id) {
    must(await sb.rpc('back_report', { rid: id }))
  },

  async startWork(_me, id) {
    must(await sb.rpc('start_work', { rid: id }))
  },

  async submitCleanup(me, id, { photo, verification }) {
    const url = await uploadPhoto(photo, me.id)
    return must(await sb.rpc('submit_cleanup', { rid: id, photo_url: url, verification }))
  },

  async setUserStatus(userId, status) {
    must(await sb.from('profiles').update({ status }).eq('id', userId))
  },

  async removeReport(id) {
    must(await sb.from('reports').delete().eq('id', id))
  },

  // Admin only: replaces every report with the demo set, owned by the demo accounts.
  async resetDemo() {
    const { users } = await load()
    const byEmail = Object.fromEntries(users.filter((u) => u.email).map((u) => [u.email, u.id]))
    const ids = Object.fromEntries(USERS.map((u) => [u.key, byEmail[u.email]]))
    if (Object.values(ids).some((v) => !v)) throw new Error('Demo accounts are missing. Run supabase/setup.sql first.')
    must(await sb.from('reports').delete().not('id', 'is', null))
    must(await sb.from('reports').insert(buildSeedReports(ids).map(toRow)))
  },

  subscribe(onChange) {
    const ch = sb
      .channel('saafsnap-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
      .subscribe()
    return () => sb.removeChannel(ch)
  },

  onAuthChange(cb) {
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user.id || null))
    return () => data.subscription.unsubscribe()
  },
}
