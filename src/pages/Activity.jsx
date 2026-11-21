import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Sparkles, Eye, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { priority, timeAgo } from '../lib/priority'
import { EmptyState, LevelChip, StatusChip, listItem } from '../components/ui'

const TABS = [
  { id: 'reported', label: 'Reported', icon: Camera, empty: "You haven't reported a spot yet." },
  { id: 'cleaned', label: 'Cleaned', icon: Sparkles, empty: "You haven't cleaned a spot yet." },
  { id: 'backed', label: 'Backed', icon: Eye, empty: 'Spots you back with "I saw this too" show up here.' },
]

export default function Activity() {
  const { me, reports } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('reported')

  const lists = useMemo(
    () => ({
      reported: reports.filter((r) => r.createdBy === me.id).sort((a, b) => b.createdAt - a.createdAt),
      cleaned: reports.filter((r) => r.cleanup?.by === me.id).sort((a, b) => b.cleanup.at - a.cleanup.at),
      backed: reports.filter((r) => r.seenBy.includes(me.id)).sort((a, b) => b.createdAt - a.createdAt),
    }),
    [reports, me.id],
  )
  const list = lists[tab]
  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink/10 bg-white hover:border-ink" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-extrabold">Your activity</h1>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2 text-sm font-extrabold transition ${tab === t.id ? 'border-ink text-white' : 'border-ink/10 bg-white text-ink/65 hover:border-ink/40'}`}>
            {tab === t.id && <motion.span layoutId="activity-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
            <span className="relative flex items-center gap-1.5"><t.icon size={15} strokeWidth={2.6} /> {t.label} · {lists[t.id].length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={current.icon} color="sky" title="Nothing here yet" text={current.empty} action={tab === 'reported' && <Link to="/snap" className="btn btn-primary">Snap a spot</Link>} />
      ) : (
        <div className="card divide-y-2 divide-ink/5 overflow-hidden">
          {list.map((r, i) => (
            <motion.div key={r.id} {...listItem(i)}>
              <Link to={`/r/${r.id}`} className="flex items-center gap-3 p-3 transition hover:bg-ink/[0.03]">
                <img src={r.cleanup?.photo || r.photo} alt="" className="h-16 w-16 shrink-0 rounded-2xl border-2 border-ink object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold">{r.ai.title}</div>
                  <div className="truncate text-xs font-bold text-ink/50">{r.landmark || 'Pinned location'} · {timeAgo(tab === 'cleaned' ? r.cleanup.at : r.createdAt)}</div>
                  <div className="mt-1 flex gap-1.5">
                    {r.status !== 'cleaned' && <LevelChip level={priority(r).level} />}
                    <StatusChip status={r.status} />
                  </div>
                </div>
                <ChevronRight size={20} className="shrink-0 text-ink/40" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
