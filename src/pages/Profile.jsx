import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, BadgeCheck, Star, Medal, Camera, Sparkles, Settings } from 'lucide-react'
import { useStore, pointsFor } from '../lib/store'
import { BADGES, badgeProgress } from '../lib/badges'
import { UserAvatar } from '../components/Stickers'
import { StatTile, IconBox } from '../components/ui'

export const ROLE = { citizen: 'Citizen', ngo: 'NGO', govt: 'Government officer', group: 'Group', admin: 'Admin' }

export default function Profile() {
  const { me, reports, users } = useStore()
  const progress = useMemo(() => badgeProgress(me.id, reports), [me.id, reports])
  const points = pointsFor(me.id, reports)
  const reported = reports.filter((r) => r.createdBy === me.id).length
  const cleaned = reports.filter((r) => r.cleanup?.by === me.id).length
  const rank = useMemo(() => {
    const all = users.filter((u) => u.role !== 'admin').map((u) => pointsFor(u.id, reports)).sort((a, b) => b - a)
    return all.indexOf(points) + 1
  }, [users, reports, points])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-leaf-100" />
        <Link to="/settings" className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink bg-white shadow-popsm transition hover:bg-leaf-50 active:translate-y-[2px] active:shadow-none" aria-label="Settings">
          <Settings size={22} />
        </Link>
        <div className="relative flex flex-wrap items-center gap-4 pr-12">
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
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Star} label="Points" value={points} color="sun" />
        <StatTile icon={Medal} label="City rank" value={rank ? `#${rank}` : '-'} color="grape" delay={0.05} />
        <StatTile icon={Camera} label="Reported" value={reported} color="sky" delay={0.1} />
        <StatTile icon={Sparkles} label="Cleaned" value={cleaned} color="leaf" delay={0.15} />
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
      </section>
    </div>
  )
}
