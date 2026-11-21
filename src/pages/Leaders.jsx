import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, pointsFor } from '../lib/store'
import { DEPT_LIST } from '../lib/departments'
import { escalation, duration } from '../lib/priority'
import { earnedBadgeIds, BADGE_MAP } from '../lib/badges'
import LeaderChart from '../components/LeaderChart'
import { GovtMascot, OrgLogo, CitizenHero, UserAvatar } from '../components/Stickers'
import { IconBox } from '../components/ui'
import { Trophy, Landmark, Star, Medal } from 'lucide-react'

const TABS = [
  { id: 'teams', label: 'Who cleans most', icon: Trophy },
  { id: 'govt', label: 'Govt report card', icon: Landmark },
  { id: 'people', label: 'Top people', icon: Star },
]
const MEDALS = ['#f59e0b', '#94a3b8', '#c2410c']

export default function Leaders() {
  const { reports, users } = useStore()
  const [tab, setTab] = useState('teams')

  const teams = useMemo(() => {
    const count = (pred) => reports.filter((r) => r.status === 'cleaned' && pred(users.find((u) => u.id === r.cleanup.by))).length
    const govt = count((u) => u?.role === 'govt')
    const citizens = count((u) => u?.role === 'citizen' || u?.role === 'admin')
    const orgs = users
      .filter((u) => (u.role === 'ngo' || u.role === 'group') && u.status === 'active')
      .map((u) => ({ u, n: reports.filter((r) => r.status === 'cleaned' && r.cleanup.by === u.id).length }))
      .filter((o) => o.n > 0)
    const list = [
      { key: 'govt', label: 'Government', value: govt, color: '#3b82f6', kind: 'govt' },
      { key: 'citizens', label: 'Citizens', value: citizens, color: '#10b981', kind: 'citizen' },
      ...orgs.map((o) => ({ key: o.u.id, label: o.u.org.name, value: o.n, color: o.u.org.color, org: o.u.org })),
    ].sort((a, b) => b.value - a.value)
    const top = list.slice(0, 6)
    const govtLeads = top[0]?.key === 'govt'
    return top.map((it) => ({
      ...it,
      sticker:
        it.kind === 'govt' ? <GovtMascot mood={govtLeads ? 'happy' : 'sleepy'} size={58} /> : it.kind === 'citizen' ? <CitizenHero size={54} /> : <OrgLogo org={it.org} size={46} animate />,
    }))
  }, [reports, users])

  const govtRank = teams.findIndex((t) => t.key === 'govt') + 1

  const deptCards = useMemo(
    () =>
      DEPT_LIST.map((d) => {
        const mine = reports.filter((r) => r.department === d.id)
        const cleaned = mine.filter((r) => r.status === 'cleaned')
        const byGovt = cleaned.filter((r) => users.find((u) => u.id === r.cleanup.by)?.role === 'govt')
        const overdue = mine.filter((r) => escalation(r).overdue).length
        const avg = byGovt.length ? byGovt.reduce((s, r) => s + (r.cleanup.at - r.createdAt), 0) / byGovt.length : null
        return { d, total: mine.length, cleaned: cleaned.length, byGovt: byGovt.length, byOthers: cleaned.length - byGovt.length, overdue, avg }
      }).filter((x) => x.total > 0),
    [reports, users],
  )

  const people = useMemo(
    () =>
      users
        .filter((u) => u.role !== 'admin' && u.status === 'active')
        .map((u) => ({ u, pts: pointsFor(u.id, reports), badges: earnedBadgeIds(u.id, reports) }))
        .filter((x) => x.pts > 0)
        .sort((a, b) => b.pts - a.pts)
        .slice(0, 10),
    [users, reports],
  )

  return (
    <div>
      <h1 className="text-3xl font-extrabold md:text-4xl">Leaderboard</h1>
      <p className="font-semibold text-ink/55">Every verified cleanup counts. Let's see who's really cleaning the city.</p>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`relative shrink-0 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition ${tab === t.id ? 'border-ink text-white' : 'border-ink/10 bg-white text-ink/65 hover:border-ink/40'}`}>
            {tab === t.id && <motion.span layoutId="lead-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
            <span className="relative flex items-center gap-1.5"><t.icon size={15} strokeWidth={2.6} /> {t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'teams' && (
        <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-5">
          <div className="card overflow-hidden bg-gradient-to-b from-white to-leaf-50 p-4 sm:p-8">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold sm:text-3xl">Who's cleaning the city?</h2>
              <p className="text-sm font-bold text-ink/50">Verified cleanups, all time</p>
            </div>
            <LeaderChart items={teams} />
          </div>
          {govtRank > 1 && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="card flex items-center gap-4 bg-sky2-100 p-4">
              <div className="shrink-0">
                <GovtMascot mood="sleepy" size={72} />
              </div>
              <div>
                <div className="font-display text-xl font-extrabold">Wake up, Government!</div>
                <p className="text-sm font-bold text-ink/65">
                  The government is #{govtRank} in cleaning its own city. NGOs and citizens are doing the work. Share this board to push them!
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {tab === 'govt' && (
        <motion.div key="govt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 grid gap-4 md:grid-cols-2">
          {deptCards.map(({ d, total, cleaned, byGovt, byOthers, overdue, avg }, i) => {
            const pct = Math.round((byGovt / total) * 100)
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5">
                <div className="flex items-center gap-3">
                  <GovtMascot mood={overdue > 0 ? 'sleepy' : 'happy'} size={56} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-display text-lg font-extrabold leading-tight">
                      <IconBox icon={d.icon} color={d.color} size="xs" /> {d.name}
                    </div>
                    <div className="text-xs font-bold text-ink/50">{total} complaints received</div>
                  </div>
                </div>
                <div className="mt-4 h-5 overflow-hidden rounded-full border-2 border-ink bg-ink/5">
                  <motion.div className="h-full bg-sky2-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.06, duration: 0.8 }} />
                </div>
                <div className="mt-1 text-xs font-extrabold text-ink/55">{pct}% resolved by the department itself</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Mini label="By govt" value={byGovt} tone="bg-sky2-100" />
                  <Mini label="By NGOs/people" value={byOthers} tone="bg-leaf-100" />
                  <Mini label="Overdue" value={overdue} tone={overdue ? 'bg-coral-100' : 'bg-ink/5'} />
                </div>
                <div className="mt-3 text-xs font-bold text-ink/50">
                  {avg ? `Average response: ${duration(avg)}` : 'No cleanups by the department yet'} · {total - cleaned} still open
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {tab === 'people' && (
        <motion.ol key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-2">
          {people.map(({ u, pts, badges }, i) => (
            <motion.li key={u.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`card-soft flex items-center gap-3 p-3 ${i < 3 ? 'border-2 border-ink' : ''}`}>
              <div className="flex w-8 justify-center font-display text-xl font-extrabold text-ink/40">
                {i < 3 ? <IconBox icon={Medal} color={MEDALS[i]} size="sm" round /> : i + 1}
              </div>
              <UserAvatar user={u} size={42} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{u.org?.name || u.name}</div>
                <div className="mt-0.5 flex gap-1">
                  {badges.slice(0, 6).map((b) => (
                    <span key={b} title={BADGE_MAP[b].name}>
                      <IconBox icon={BADGE_MAP[b].icon} color={BADGE_MAP[b].color} size="xs" round />
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-full border-2 border-ink bg-sun-400 px-3 py-0.5 font-display font-extrabold">{pts}</div>
            </motion.li>
          ))}
        </motion.ol>
      )}
    </div>
  )
}

function Mini({ label, value, tone }) {
  return (
    <div className={`rounded-2xl p-2 ${tone}`}>
      <div className="font-display text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-0.5 text-[10px] font-extrabold uppercase text-ink/55">{label}</div>
    </div>
  )
}
