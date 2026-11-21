import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Clock, BadgeCheck, Star, Medal, Camera, Sparkles } from 'lucide-react'
import { useStore, pointsFor } from '../lib/store'
import { BADGES, badgeProgress } from '../lib/badges'
import { UserAvatar } from '../components/Stickers'
import { StatTile, EmptyState, IconBox } from '../components/ui'
import ReportCard from '../components/ReportCard'

const ROLE = { citizen: 'Citizen', ngo: 'NGO', govt: 'Government officer', group: 'Group', admin: 'Admin' }

export default function Profile() {
  const { me, reports, users, logout } = useStore()
  const navigate = useNavigate()
  const progress = useMemo(() => badgeProgress(me.id, reports), [me.id, reports])
  const points = pointsFor(me.id, reports)
  const mine = reports.filter((r) => r.createdBy === me.id)
  const cleaned = reports.filter((r) => r.cleanup?.by === me.id)
  const backed = reports.filter((r) => r.seenBy.includes(me.id)).length
  const rank = useMemo(() => {
    const all = users.filter((u) => u.role !== 'admin').map((u) => pointsFor(u.id, reports)).sort((a, b) => b - a)
    return all.indexOf(points) + 1
  }, [users, reports, points])
  const activity = [...cleaned, ...mine.filter((r) => !cleaned.includes(r))].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-leaf-100" />
        <div className="relative flex flex-wrap items-center gap-4">
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
            <UserAvatar user={me} size={84} />
          </motion.div>
          <div className="min-w-[170px] flex-1">
            <h1 className="break-words text-3xl font-extrabold leading-tight">{me.org?.name || me.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="chip bg-ink text-white">{ROLE[me.role]}</span>
              {me.role !== 'citizen' && me.role !== 'admin' &&
                (me.status === 'active' ? (
                  <span className="chip bg-leaf-100 text-leaf-700"><BadgeCheck size={14} /> Verified</span>
                ) : (
                  <span className="chip bg-sun-100 text-amber-700"><Clock size={14} /> Verification pending</span>
                ))}
              <span className="text-sm font-bold text-ink/50">{me.email}</span>
            </div>
          </div>
          <button className="btn btn-white btn-sm" onClick={() => { logout(); navigate('/') }}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Star} label="Points" value={points} color="sun" />
        <StatTile icon={Medal} label="City rank" value={`#${rank}`} color="grape" delay={0.05} />
        <StatTile icon={Camera} label="Reported" value={mine.length} color="sky" delay={0.1} />
        <StatTile icon={Sparkles} label="Cleaned" value={cleaned.length} color="leaf" delay={0.15} />
      </div>

      <section>
        <h2 className="mb-3 text-2xl font-extrabold">Badges</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((b, i) => {
            const [have, need] = progress[b.id]
            const got = have >= need
            return (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }}
                className={`flex flex-col items-center rounded-3xl border-2 p-4 text-center ${got ? 'border-ink bg-white shadow-pop' : 'border-ink/10 bg-white/60'}`}>
                <IconBox icon={b.icon} color={got ? b.color : '#cbd5e1'} size="lg" round className={got ? '!h-16 !w-16' : '!h-16 !w-16 !border-ink/20 opacity-70'} />
                <div className="mt-2 font-display text-base font-extrabold leading-tight">{b.name}</div>
                <div className="text-[11px] font-semibold text-ink/50">{b.desc}</div>
                {!got && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-leaf-500" style={{ width: `${(have / need) * 100}%` }} />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
        <p className="mt-2 text-xs font-bold text-ink/45">Points: 10 per report, 2 per "I saw this too" ({backed} so far), 50+ per verified cleanup (more for severe spots).</p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-extrabold">My activity</h2>
        {activity.length === 0 ? (
          <EmptyState icon={Camera} color="sky" title="No activity yet" text="Report a spot or clean one to see it here." action={<Link to="/snap" className="btn btn-primary">Snap a spot</Link>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {activity.map((r, i) => <ReportCard key={r.id} report={r} index={i} />)}
          </div>
        )}
      </section>
    </div>
  )
}
