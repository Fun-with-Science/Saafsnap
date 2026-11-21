import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, MapPin, AlarmClock, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { priority, escalation, seenCount, timeAgo } from '../lib/priority'
import { DEPARTMENTS, officerFor } from '../lib/departments'
import { LevelChip, StatusChip, IconBox, listItem } from './ui'
import { UserAvatar, OrgLogo } from './Stickers'

export function CleanedRibbon({ cleaner, className = '' }) {
  if (!cleaner) return null
  return (
    <div className={`flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pl-1 pr-3 text-sm font-extrabold shadow-popsm ${className}`}>
      {cleaner.role === 'ngo' || cleaner.role === 'group' ? <OrgLogo org={cleaner.org} size={26} /> : <UserAvatar user={cleaner} size={26} />}
      <span className="truncate">Cleaned by {cleaner.org?.name || cleaner.name}</span>
    </div>
  )
}

export default function ReportCard({ report, index = 0 }) {
  const { userById, me, confirmSeen } = useStore()
  const navigate = useNavigate()
  const [pop, setPop] = useState(false)
  const author = userById(report.createdBy)
  const { level } = priority(report)
  const esc = escalation(report)
  const cleaner = report.cleanup ? userById(report.cleanup.by) : null
  const dept = DEPARTMENTS[report.department]
  const already = report.seenBy.includes(me.id)
  const own = report.createdBy === me.id
  const canBack = !own && !already && report.status !== 'cleaned'

  const back = () => {
    if (!canBack) return
    confirmSeen(report.id)
    setPop(true)
    setTimeout(() => setPop(false), 900)
  }

  // Wait briefly so a double-tap backs the report instead of opening it.
  const clickTimer = useRef(null)
  const onPhotoClick = () => {
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => navigate(`/r/${report.id}`), 260)
  }
  const onPhotoDouble = () => {
    clearTimeout(clickTimer.current)
    back()
  }

  return (
    <motion.article {...listItem(index)} layout className="card flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <UserAvatar user={author} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold">{author?.name || 'Someone'}</div>
          <div className="flex items-center gap-1 truncate text-xs font-bold text-ink/50">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{report.landmark || `${report.location.lat.toFixed(3)}, ${report.location.lng.toFixed(3)}`}</span>
            <span>· {timeAgo(report.createdAt)}</span>
          </div>
        </div>
        <LevelChip level={level} />
      </div>

      <div className="relative aspect-[4/3] cursor-pointer select-none overflow-hidden border-y-2 border-ink bg-ink/5" onDoubleClick={onPhotoDouble} onClick={onPhotoClick}>
        <img src={report.cleanup?.photo || report.photo} alt={report.ai.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" loading="lazy" draggable={false} />
        {report.cleanup && (
          <div className="absolute bottom-3 left-3 w-24 overflow-hidden rounded-xl border-2 border-ink shadow-popsm">
            <img src={report.photo} alt="Before cleanup" className="aspect-[4/3] w-full object-cover" />
            <div className="bg-coral-500 py-0.5 text-center text-[10px] font-extrabold uppercase text-white">Before</div>
          </div>
        )}
        {cleaner && <CleanedRibbon cleaner={cleaner} className="absolute left-3 top-3 max-w-[85%]" />}
        {esc.overdue && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border-2 border-ink bg-coral-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-popsm">
            <AlarmClock size={14} /> Overdue
          </div>
        )}
        <AnimatePresence>
          {pop && (
            <motion.div className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.2, rotate: -20 }} animate={{ scale: [0.2, 1.4, 1], rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }}
                className="grid h-24 w-24 place-items-center rounded-full border-[3px] border-ink bg-sun-400 text-ink shadow-pop">
                <Eye size={48} strokeWidth={2.6} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Link to={`/r/${report.id}`} className="font-display text-xl font-extrabold leading-tight hover:text-leaf-600">
          {report.ai.title}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {report.ai.waste_types.slice(0, 3).map((w) => (
            <span key={w} className="chip bg-ink/5 text-ink/70">{w}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-ink/[0.04] px-3 py-2 text-xs font-bold text-ink/65">
          <IconBox icon={dept.icon} color={dept.color} size="xs" />
          <span className="truncate">→ {officerFor(report.department, report.ward, esc.level)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={back}
            disabled={!canBack}
            className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-extrabold transition ${already ? 'border-sun-500 bg-sun-100 text-amber-700' : canBack ? 'border-ink bg-white hover:bg-sun-100' : 'border-ink/10 bg-ink/5 text-ink/50'}`}
            title={own ? 'Your report' : already ? 'You backed this' : 'I saw this too'}
          >
            <Eye size={16} /> {seenCount(report)}
            <span className="hidden sm:inline">{already ? 'backed' : 'saw this'}</span>
          </motion.button>
          <StatusChip status={report.status} />
          <Link to={`/r/${report.id}`} className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink/10 hover:border-ink" aria-label="Open report">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
