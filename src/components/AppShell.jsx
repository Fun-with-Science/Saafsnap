import { Suspense } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, Map, Camera, Trophy, User, Briefcase, ShieldCheck, LogOut, Clock } from 'lucide-react'
import { useStore, pointsFor } from '../lib/store'
import Logo from './Logo'
import LocationPrompt from './LocationPrompt'
import { PageLoader } from './ui'
import { UserAvatar } from './Stickers'
import { AI_MODE } from '../lib/ai'

const ROLE_LABEL = { citizen: 'Citizen', ngo: 'NGO', govt: 'Government', group: 'Group', admin: 'Admin' }

export default function AppShell() {
  const { me, reports, logout, dataMode } = useStore()
  const location = useLocation()
  const navigate = useNavigate()

  const items = [
    { to: '/feed', label: 'Feed', icon: Home },
    { to: '/map', label: 'Map', icon: Map },
    { to: '/snap', label: 'Snap', icon: Camera, primary: true },
    { to: '/leaders', label: 'Leaders', icon: Trophy },
    { to: '/me', label: 'Me', icon: User },
  ]
  const extra = []
  if (me.role === 'govt') extra.push({ to: '/desk', label: 'My Desk', icon: Briefcase })
  if (me.role === 'admin') extra.push({ to: '/admin', label: 'Admin', icon: ShieldCheck })

  return (
    <div className="min-h-screen md:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r-2 border-ink/10 bg-white/80 p-5 backdrop-blur md:flex">
        <button onClick={() => navigate('/feed')} className="mb-8 text-left">
          <Logo withText />
        </button>
        <nav className="flex flex-1 flex-col gap-1.5">
          {[...items, ...extra].map((it) =>
            it.primary ? (
              <NavLink key={it.to} to={it.to} className="btn btn-primary my-2 w-full">
                <it.icon size={20} strokeWidth={2.6} /> Snap a spot
              </NavLink>
            ) : (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-2xl px-4 py-3 font-display text-lg font-bold transition ${isActive ? 'text-ink' : 'text-ink/55 hover:bg-ink/5 hover:text-ink'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="side-active" className="absolute inset-0 rounded-2xl border-2 border-ink bg-leaf-100" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <it.icon size={22} strokeWidth={2.4} className="relative" />
                    <span className="relative">{it.label === 'Me' ? 'My profile' : it.label}</span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>
        <div className="card-soft flex items-center gap-3 p-3">
          <UserAvatar user={me} size={40} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{me.org?.name || me.name}</div>
            <div className="text-xs font-bold text-ink/50">
              {ROLE_LABEL[me.role]} · {pointsFor(me.id, reports)} pts
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/') }} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink/5" title="Log out" aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
        <div className="mt-3 text-center text-[11px] font-bold text-ink/40">
          AI: {AI_MODE === 'gemini' ? 'Gemini connected' : 'Demo mode (add Gemini key)'}
          <br />
          Data: {dataMode === 'supabase' ? 'Supabase (shared)' : 'This device only'}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-ink/10 bg-cream/90 px-4 py-2.5 backdrop-blur md:hidden">
        <button onClick={() => navigate('/feed')}>
          <Logo withText size={30} />
        </button>
        <div className="flex items-center gap-2">
          {extra.map((it) => (
            <NavLink key={it.to} to={it.to} className="btn btn-white btn-sm !px-2.5" aria-label={it.label}>
              <it.icon size={18} />
            </NavLink>
          ))}
          <NavLink to="/me">
            <UserAvatar user={me} size={36} />
          </NavLink>
        </div>
      </header>

      {me.status === 'pending' && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-8">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-sun-400 bg-sun-100 px-4 py-3 text-sm font-bold">
            <Clock size={18} className="shrink-0 text-amber-600" />
            Your {ROLE_LABEL[me.role]} account is waiting for verification by the SaafSnap team. You can still report and explore.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <LocationPrompt />

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/10 bg-white/95 px-2 pt-1.5 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between">
          {items.map((it) =>
            it.primary ? (
              <NavLink key={it.to} to={it.to} className="-mt-7 flex flex-col items-center" aria-label="Snap a spot">
                <motion.span whileTap={{ scale: 0.9 }} className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-leaf-500 text-white shadow-pop">
                  <Camera size={28} strokeWidth={2.6} />
                </motion.span>
                <span className="mt-0.5 text-[11px] font-extrabold">Snap</span>
              </NavLink>
            ) : (
              <NavLink key={it.to} to={it.to} className="relative flex w-16 flex-col items-center gap-0.5 py-1.5">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="tab-active" className="absolute inset-x-2 inset-y-0 rounded-2xl bg-leaf-100" transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}
                    <it.icon size={22} strokeWidth={isActive ? 2.8 : 2.2} className={`relative ${isActive ? 'text-leaf-700' : 'text-ink/50'}`} />
                    <span className={`relative text-[11px] font-extrabold ${isActive ? 'text-leaf-700' : 'text-ink/50'}`}>{it.label}</span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </div>
      </nav>
    </div>
  )
}
