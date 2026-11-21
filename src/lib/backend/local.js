// Stores everything in this browser (IndexedDB). Used when Supabase isn't configured.
import { get, set } from 'idb-keyval'
import { buildSeed } from '../seed'
import { hashPassword, newId } from '../auth'
import { newReport, withSeen, withProgress, withCleanupResult } from '../reportOps'

const SESSION_KEY = 'saafsnap.session'
const DB_VERSION = 2

let users = []
let reports = []

function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}
function writeSession(id) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage blocked: session lasts for this tab only */
  }
}
function save() {
  set('users', users).catch(() => {})
  set('reports', reports).catch(() => {})
}
const update = (id, fn) => {
  reports = reports.map((r) => (r.id === id ? fn(r) : r))
  save()
}

export const localBackend = {
  mode: 'local',

  async init() {
    try {
      if ((await get('version')) === DB_VERSION) {
        users = (await get('users')) || []
        reports = (await get('reports')) || []
      }
    } catch {
      /* IndexedDB unavailable: fall through to in-memory seed */
    }
    if (!users.length) {
      const seed = buildSeed()
      users = seed.users
      reports = seed.reports
      save()
      set('version', DB_VERSION).catch(() => {})
    }
    return { users, reports, sessionId: readSession() }
  },

  async load() {
    return { users, reports }
  },

  async signup({ name, email, password, role, org }) {
    const e = email.trim().toLowerCase()
    if (users.some((u) => u.email === e)) throw new Error('An account with this email already exists.')
    const salt = newId()
    const user = {
      id: newId('u_'),
      name: name.trim(),
      email: e,
      salt,
      passwordHash: hashPassword(password, salt),
      role,
      status: role === 'citizen' ? 'active' : 'pending',
      org: role === 'citizen' ? null : org,
      createdAt: Date.now(),
    }
    users = [...users, user]
    save()
    writeSession(user.id)
    return { userId: user.id, needsConfirm: false }
  },

  async login(email, password) {
    const user = users.find((u) => u.email === email.trim().toLowerCase())
    if (!user || hashPassword(password, user.salt) !== user.passwordHash) throw new Error('Wrong email or password.')
    if (user.status === 'rejected') throw new Error('This account was not approved. Contact the SaafSnap team.')
    writeSession(user.id)
    return user.id
  },

  async logout() {
    writeSession(null)
  },

  async createReport(me, input) {
    const r = newReport(me, input, newId('r_'))
    reports = [r, ...reports]
    save()
    return r
  },

  async back(me, id) {
    update(id, (r) => withSeen(r, me))
  },

  async startWork(me, id) {
    update(id, (r) => withProgress(r, me))
  },

  async submitCleanup(me, id, data) {
    update(id, (r) => withCleanupResult(r, me, data))
    return data.verification.verified
  },

  async setUserStatus(userId, status) {
    users = users.map((u) => (u.id === userId ? { ...u, status } : u))
    save()
  },

  async removeReport(id) {
    reports = reports.filter((r) => r.id !== id)
    save()
  },

  async resetDemo() {
    const seed = buildSeed()
    users = seed.users
    reports = seed.reports
    save()
    writeSession(null)
  },

  subscribe() {
    return () => {}
  },

  onAuthChange() {
    return () => {}
  },
}
