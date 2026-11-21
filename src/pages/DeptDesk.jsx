import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hammer, ChevronRight, AlarmClock, Hourglass, Inbox, Landmark, HandHeart, PartyPopper } from 'lucide-react'
import { useStore } from '../lib/store'
import { DEPARTMENTS } from '../lib/departments'
import { priority, escalation, seenCount, timeAgo, duration } from '../lib/priority'
import { LevelChip, StatusChip, StatTile, EmptyState, IconBox } from '../components/ui'
import { GovtMascot } from '../components/Stickers'

const TABS = [
  { id: 'open', label: 'New' },
  { id: 'progress', label: 'In progress' },
  { id: 'done', label: 'Cleaned' },
]

export default function DeptDesk() {
  const { me, reports, startWork, userById } = useStore()
  const [tab, setTab] = useState('open')
  const dept = DEPARTMENTS[me.org?.department]

  const mine = useMemo(() => reports.filter((r) => r.department === dept?.id), [reports, dept])
  const list = useMemo(() => {
    const l = mine.filter((r) => (tab === 'open' ? r.status === 'assigned' : tab === 'progress' ? r.status === 'in_progress' : r.status === 'cleaned'))
    return tab === 'done' ? l.sort((a, b) => b.cleanup.at - a.cleanup.at) : l.sort((a, b) => priority(b).score - priority(a).score)
  }, [mine, tab])

  if (me.status !== 'active')
    return (
      <EmptyState icon={Hourglass} color="sun" title="Waiting for verification" text="Once the SaafSnap team verifies your employee ID, complaints for your department will appear here." />
    )

  const overdue = mine.filter((r) => escalation(r).overdue).length
  const open = mine.filter((r) => r.status !== 'cleaned').length
  const byUs = mine.filter((r) => r.status === 'cleaned' && userById(r.cleanup.by)?.role === 'govt').length
  const byOthers = mine.filter((r) => r.status === 'cleaned').length - byUs

  return (
    <div>
      <div className="card flex flex-wrap items-center gap-4 p-5" style={{ background: `${dept.color}14` }}>
        <GovtMascot mood={overdue ? 'sleepy' : 'happy'} size={76} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-ink/45">My desk</div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold leading-tight md:text-3xl">
            <IconBox icon={dept.icon} color={dept.color} size="sm" /> {dept.name}
          </h1>
          <p className="text-sm font-bold text-ink/55">{me.name} · complaints are routed here by AI automatically</p>
        </div>
      </div>

      {overdue > 0 && (
        <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-coral-500 bg-coral-100 px-4 py-3 font-bold">
          <AlarmClock className="shrink-0 text-coral-600" />
          {overdue} complaint{overdue > 1 ? 's are' : ' is'} overdue and visible to the public as escalated. Act now to wake the mascot up!
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Inbox} label="Open complaints" value={open} color="sky" />
        <StatTile icon={AlarmClock} label="Overdue" value={overdue} color="coral" delay={0.05} />
        <StatTile icon={Landmark} label="Cleaned by us" value={byUs} color="leaf" delay={0.1} />
        <StatTile icon={HandHeart} label="Cleaned by NGOs/public" value={byOthers} color="sun" delay={0.15} />
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`relative rounded-full border-2 px-4 py-2 text-sm font-extrabold ${tab === t.id ? 'border-ink text-white' : 'border-ink/10 bg-white text-ink/60'}`}>
            {tab === t.id && <motion.span layoutId="desk-tab" className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 && <EmptyState icon={PartyPopper} color="leaf" title="Nothing here" text="No complaints in this list right now." />}
        {list.map((r, i) => {
          const esc = escalation(r)
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <img src={r.cleanup?.photo || r.photo} alt="" className="h-40 w-full shrink-0 rounded-2xl border-2 border-ink object-cover sm:h-20 sm:w-28" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <LevelChip level={priority(r).level} />
                  <StatusChip status={r.status} />
                  {esc.overdue && <span className="chip bg-coral-500 text-white">Overdue {duration(esc.overdueMs)}</span>}
                </div>
                <div className="mt-1 truncate font-display text-lg font-extrabold">{r.ai.title}</div>
                <div className="truncate text-xs font-bold text-ink/50">
                  {r.landmark || 'Pinned location'} · Ward {r.ward} · {timeAgo(r.createdAt)} · {seenCount(r)} reports · Fix within {r.ai.urgency_hours}h
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.status === 'assigned' && (
                  <button className="btn btn-sky btn-sm flex-1" onClick={() => startWork(r.id)}>
                    <Hammer size={16} /> Start work
                  </button>
                )}
                <Link to={`/r/${r.id}`} className="btn btn-white btn-sm flex-1">
                  {r.status === 'cleaned' ? 'View' : 'Upload proof'} <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
