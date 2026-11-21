import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { backend } from './backend'
import { earnedBadgeIds, BADGE_MAP } from './badges'
import { getPosition, locationPermission } from './image'
import { withLike } from './reportOps'

const Ctx = createContext(null)
export const DATA_MODE = backend.mode

export function pointsFor(userId, reports) {
  let pts = 0
  for (const r of reports) {
    if (r.createdBy === userId) pts += 10
    if (r.seenBy?.includes(userId)) pts += 2
    if (r.status === 'cleaned' && r.cleanup?.by === userId) pts += 50 + (r.ai?.severity || 0) * 5
  }
  return pts
}

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [toast, setToast] = useState(null)
  const reportsRef = useRef([])
  const sessionRef = useRef(null)
  sessionRef.current = sessionId

  const apply = useCallback(({ users: u, reports: r }) => {
    setUsers(u)
    setReports(r)
    reportsRef.current = r
    return r
  }, [])

  const refresh = useCallback(async () => apply(await backend.load()), [apply])

  const showError = useCallback((err) => {
    setToast(err?.message || 'Something went wrong. Please try again.')
    setTimeout(() => setToast(null), 4500)
  }, [])

  useEffect(() => {
    let alive = true
    backend
      .init()
      .then((d) => {
        if (!alive) return
        apply(d)
        setSessionId(d.sessionId)
      })
      .catch(showError)
      .finally(() => alive && setReady(true))
    const offAuth = backend.onAuthChange(async (id) => {
      if (id === sessionRef.current) return
      setSessionId(id)
      if (id) refresh().catch(showError)
    })
    let timer
    const offLive = backend.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(() => sessionRef.current && refresh().catch(() => {}), 300)
    })
    return () => {
      alive = false
      offAuth()
      offLive()
    }
  }, [apply, refresh, showError])

  const [here, setHere] = useState(null)
  const [locPerm, setLocPerm] = useState('unknown')

  const refreshLocation = useCallback(async () => {
    const p = await getPosition()
    if (p) {
      setHere({ ...p, at: Date.now() })
      setLocPerm('granted')
    } else {
      setLocPerm(await locationPermission())
    }
    return p
  }, [])

  useEffect(() => {
    if (!sessionId) return
    locationPermission().then((s) => {
      setLocPerm(s)
      if (s === 'granted') refreshLocation()
    })
  }, [sessionId, refreshLocation])

  const me = useMemo(() => users.find((u) => u.id === sessionId) || null, [users, sessionId])
  const meRef = useRef(me)
  meRef.current = me

  // Runs an action, reloads data, and pops a celebration for any badge the user just unlocked.
  const act = useCallback(
    async (fn, extra) => {
      const user = meRef.current
      const before = user ? earnedBadgeIds(user.id, reportsRef.current) : []
      try {
        const result = await fn(user)
        const next = await refresh()
        if (user) {
          const fresh = earnedBadgeIds(user.id, next).filter((b) => !before.includes(b)).map((b) => BADGE_MAP[b])
          const bonus = typeof extra === 'function' ? extra(result) : extra
          if (fresh.length || bonus) setCelebration({ badges: fresh, ...bonus })
        }
        return result
      } catch (err) {
        showError(err)
        throw err
      }
    },
    [refresh, showError],
  )

  const login = useCallback(
    async (email, password) => {
      const id = await backend.login(email, password)
      const d = await backend.load()
      apply(d)
      setSessionId(id)
      return d.users.find((u) => u.id === id)
    },
    [apply],
  )

  const signup = useCallback(
    async (data) => {
      const { userId, needsConfirm } = await backend.signup(data)
      if (!userId) return { user: null, needsConfirm }
      const d = await backend.load()
      apply(d)
      setSessionId(userId)
      return { user: d.users.find((u) => u.id === userId), needsConfirm }
    },
    [apply],
  )

  const logout = useCallback(async () => {
    await backend.logout()
    setSessionId(null)
    setHere(null)
    try {
      sessionStorage.removeItem('saafsnap.locationAsked')
    } catch {
      /* storage blocked */
    }
  }, [])

  const value = {
    ready,
    users,
    reports,
    me,
    celebration,
    toast,
    dataMode: backend.mode,
    here,
    locPerm,
    refreshLocation,
    clearCelebration: () => setCelebration(null),
    userById: (id) => users.find((u) => u.id === id) || null,
    signup,
    login,
    loginWithGoogle: backend.loginWithGoogle,
    logout,
    createReport: (input) => act((u) => backend.createReport(u, input)),
    confirmSeen: (id) => act((u) => backend.back(u, id)).catch(() => {}),
    toggleLike: (id) => {
      const u = meRef.current
      // Flip the heart immediately; the server copy catches up on refresh.
      setReports((rs) => {
        const next = rs.map((r) => (r.id === id ? withLike(r, u) : r))
        reportsRef.current = next
        return next
      })
      backend
        .toggleLike(u, id)
        .then(refresh)
        .catch((err) => {
          showError(err)
          refresh().catch(() => {})
        })
    },
    startWork: (id) => act((u) => backend.startWork(u, id)).catch(() => {}),
    submitCleanup: (id, data) => {
      const r = reportsRef.current.find((x) => x.id === id)
      return act(
        (u) => backend.submitCleanup(u, id, data),
        (ok) => (ok ? { cleaned: r?.ai?.title || 'this spot', points: 50 + (r?.ai?.severity || 0) * 5 } : null),
      )
    },
    setUserStatus: (id, status) => act(() => backend.setUserStatus(id, status)).catch(() => {}),
    removeReport: (id) => act(() => backend.removeReport(id)).catch(() => {}),
    resetDemo: async () => {
      await act(() => backend.resetDemo())
      if (backend.mode === 'local') setSessionId(null)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
