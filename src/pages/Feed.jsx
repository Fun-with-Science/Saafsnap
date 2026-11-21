import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Flame, Clock, Sparkles, Trash2, Siren, Users, Sprout } from 'lucide-react'
import { useStore } from '../lib/store'
import { priority } from '../lib/priority'
import ReportCard from '../components/ReportCard'
import { EmptyState, StatTile } from '../components/ui'

const FILTERS = [
  { id: 'hot', label: 'Most urgent', icon: Flame },
  { id: 'new', label: 'Newest', icon: Clock },
  { id: 'cleaned', label: 'Cleaned', icon: Sparkles },
  { id: 'mine', label: 'Mine', icon: Camera },
]

export default function Feed() {
  const { reports, me } = useStore()
  const [filter, setFilter] = useState('hot')

  const stats = useMemo(() => {
    const open = reports.filter((r) => r.status !== 'cleaned')
    const week = Date.now() - 7 * 864e5
    return {
      open: open.length,
      critical: open.filter((r) => priority(r).level === 'critical').length,
      cleanedWeek: reports.filter((r) => r.status === 'cleaned' && r.cleanup.at > week).length,
      people: new Set(reports.flatMap((r) => [r.createdBy, ...r.seenBy])).size + reports.reduce((s, r) => s + (r.seenExtra || 0), 0),
    }
  }, [reports])

  const list = useMemo(() => {
    let l = reports
    if (filter === 'hot') l = l.filter((r) => r.status !== 'cleaned').sort((a, b) => priority(b).score - priority(a).score)
    else if (filter === 'new') l = [...l].sort((a, b) => b.createdAt - a.createdAt)
    else if (filter === 'cleaned') l = l.filter((r) => r.status === 'cleaned').sort((a, b) => b.cleanup.at - a.cleanup.at)
    else l = l.filter((r) => r.createdBy === me.id || r.cleanup?.by === me.id).sort((a, b) => b.createdAt - a.createdAt)
    return l
  }, [reports, filter, me.id])

  const first = (me.org?.name || me.name).split(' ')[0]

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Hey {first}</h1>
          <p className="font-semibold text-ink/55">Here's what your city is reporting right now.</p>
        </div>
        <Link to="/snap" className="btn btn-primary hidden md:inline-flex">
          <Camera size={20} /> Snap a spot
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Trash2} label="Open spots" value={stats.open} color="sun" delay={0} />
        <StatTile icon={Siren} label="Critical now" value={stats.critical} color="coral" delay={0.05} />
        <StatTile icon={Sparkles} label="Cleaned this week" value={stats.cleanedWeek} color="leaf" delay={0.1} />
        <StatTile icon={Users} label="People involved" value={stats.people} color="sky" delay={0.15} />
      </div>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`relative shrink-0 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition ${filter === f.id ? 'border-ink text-white' : 'border-ink/10 bg-white text-ink/65 hover:border-ink/40'}`}>
            {filter === f.id && <motion.span layoutId="feed-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
            <span className="relative flex items-center gap-1.5"><f.icon size={15} strokeWidth={2.6} /> {f.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState
            icon={filter === 'mine' ? Camera : Sprout}
            color={filter === 'mine' ? 'sky' : 'leaf'}
            title={filter === 'mine' ? 'No reports from you yet' : 'Nothing here yet'}
            text={filter === 'mine' ? 'Spotted garbage somewhere? Snap it and our AI will do the rest.' : 'Check another tab.'}
            action={filter === 'mine' && <Link to="/snap" className="btn btn-primary">Snap your first spot</Link>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((r, i) => (
              <ReportCard key={r.id} report={r} index={i} />
            ))}
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-xs font-bold text-ink/40">Tip: double-tap a photo to say "I saw this too". It pushes the spot up the priority list.</p>
    </div>
  )
}
