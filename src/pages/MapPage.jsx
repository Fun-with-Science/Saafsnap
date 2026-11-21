import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Crosshair, Flame, Eye } from 'lucide-react'
import { useStore } from '../lib/store'
import { LEVELS, priority, seenCount } from '../lib/priority'
import { getPosition } from '../lib/image'
import { CityMap } from '../components/MapView'
import { LevelChip, Spinner, IconBox } from '../components/ui'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical', dot: LEVELS.critical.color },
  { id: 'open', label: 'Open', dot: LEVELS.high.color },
  { id: 'clean', label: 'Cleaned', dot: LEVELS.clean.color },
]

export default function MapPage() {
  const { reports } = useStore()
  const [filter, setFilter] = useState('all')
  const [fly, setFly] = useState(null)
  const [me, setMe] = useState(null)
  const [locating, setLocating] = useState(false)

  const shown = useMemo(() => {
    return reports.filter((r) => {
      const l = priority(r).level
      if (filter === 'critical') return l === 'critical'
      if (filter === 'open') return l !== 'clean'
      if (filter === 'clean') return l === 'clean'
      return true
    })
  }, [reports, filter])

  const hot = useMemo(() => reports.filter((r) => r.status !== 'cleaned').sort((a, b) => priority(b).score - priority(a).score).slice(0, 6), [reports])

  const locate = async () => {
    setLocating(true)
    const p = await getPosition()
    setLocating(false)
    if (p) {
      setMe(p)
      setFly([p.lat, p.lng])
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Pollution map</h1>
          <p className="font-semibold text-ink/55">The more people report a spot, the bigger and redder it gets.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-extrabold shadow-popsm transition ${filter === f.id ? 'bg-ink text-white' : 'bg-white hover:bg-leaf-50'}`}>
                {f.dot && <span className="h-3 w-3 rounded-full border-2 border-current" style={{ background: f.dot }} />}
                {f.label}
              </button>
            ))}
          </div>
          <div className="card relative overflow-hidden">
            <CityMap reports={shown} flyTo={fly} me={me} className="h-[calc(100dvh-330px)] min-h-[360px] w-full md:h-[calc(100vh-250px)]" />
            <button onClick={locate} className="btn btn-white btn-sm absolute bottom-4 right-3 z-[500]" aria-label="Show my location">
              {locating ? <Spinner size={16} /> : <Crosshair size={18} />} Near me
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-extrabold text-ink/70">
            {['critical', 'high', 'medium', 'low', 'clean'].map((l) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: LEVELS[l].color }} /> {LEVELS[l].label}
              </span>
            ))}
          </div>
        </div>

        <div className="card-soft p-4">
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            <IconBox icon={Flame} color="coral" size="sm" /> Hottest spots
          </h2>
          <p className="mb-3 text-sm font-semibold text-ink/55">Still waiting for action. Tap to find on the map.</p>
          <ul className="space-y-2">
            {hot.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <button onClick={() => setFly([r.location.lat, r.location.lng])} className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink/10 p-2 text-left transition hover:border-ink">
                  <img src={r.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{r.landmark || r.ai.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <LevelChip level={priority(r).level} />
                      <span className="flex items-center gap-1 text-xs font-bold text-ink/50"><Eye size={13} /> {seenCount(r)}</span>
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
