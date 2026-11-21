import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './lib/store'
import AppShell from './components/AppShell'
import Celebration from './components/Celebration'
import Logo from './components/Logo'
import { PageLoader } from './components/ui'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Profile from './pages/Profile'

// Less-visited pages (and the map library) load separately, then get prefetched once the app is idle.
const pages = {
  Signup: () => import('./pages/Signup'),
  NewReport: () => import('./pages/NewReport'),
  ReportDetail: () => import('./pages/ReportDetail'),
  MapPage: () => import('./pages/MapPage'),
  Leaders: () => import('./pages/Leaders'),
  Settings: () => import('./pages/Settings'),
  Activity: () => import('./pages/Activity'),
  DeptDesk: () => import('./pages/DeptDesk'),
  Admin: () => import('./pages/Admin'),
}
const Signup = lazy(pages.Signup)
const NewReport = lazy(pages.NewReport)
const ReportDetail = lazy(pages.ReportDetail)
const MapPage = lazy(pages.MapPage)
const Leaders = lazy(pages.Leaders)
const Settings = lazy(pages.Settings)
const Activity = lazy(pages.Activity)
const DeptDesk = lazy(pages.DeptDesk)
const Admin = lazy(pages.Admin)

function usePrefetchPages() {
  useEffect(() => {
    const run = () => Object.values(pages).forEach((load) => load().catch(() => {}))
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500))
    const id = idle(run)
    return () => (window.cancelIdleCallback || clearTimeout)(id)
  }, [])
}


function RequireAuth({ children, role }) {
  const { me } = useStore()
  const loc = useLocation()
  if (!me) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (role && me.role !== role) return <Navigate to="/feed" replace />
  return children
}

export default function App() {
  const { ready, toast } = useStore()
  const location = useLocation()
  const top = location.pathname.split('/')[1]
  const routeKey = ['', 'login', 'signup'].includes(top) ? location.pathname : 'app'
  usePrefetchPages()

  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="animate-bounce">
          <Logo size={64} />
        </div>
      </div>
    )

  return (
    <>
      <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={routeKey}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/feed" element={<Feed />} />
            <Route path="/snap" element={<NewReport />} />
            <Route path="/r/:id" element={<ReportDetail />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/leaders" element={<Leaders />} />
            <Route path="/me" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/activity" element={<Activity />} />
            <Route path="/desk" element={<RequireAuth role="govt"><DeptDesk /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
      <Celebration />
      <AnimatePresence>
        {toast && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-x-4 bottom-24 z-[1100] mx-auto max-w-md rounded-2xl border-2 border-ink bg-coral-500 px-4 py-3 text-center font-bold text-white shadow-pop md:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
