import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Eye, Share2, Sparkles, AlarmClock, Hammer, CheckCircle2, XCircle, Camera, Send, Flag, Bot, MapPin, Ban, Search, SearchX, Mail, PartyPopper } from 'lucide-react'
import { useStore } from '../lib/store'
import { priority, escalation, seenCount, timeAgo, duration } from '../lib/priority'
import { DEPARTMENTS, officerFor } from '../lib/departments'
import { verifyCleanup } from '../lib/ai'
import { fileToDataUrl, readExif, getPosition } from '../lib/image'
import { LevelChip, StatusChip, SeverityMeter, Modal, EmptyState, IconBox } from '../components/ui'
import { UserAvatar } from '../components/Stickers'
import { CleanedRibbon } from '../components/ReportCard'
import { MiniMap } from '../components/MapView'
import PhotoPicker from '../components/PhotoPicker'
import AiScanner from '../components/AiScanner'

const TL_ICON = {
  reported: { icon: Camera, color: 'sky' },
  ai: { icon: Bot, color: 'grape' },
  sent: { icon: Send, color: 'ink' },
  seen: { icon: Eye, color: 'sun' },
  progress: { icon: Hammer, color: 'sky' },
  cleaned: { icon: Sparkles, color: 'leaf' },
  rejected: { icon: Ban, color: 'coral' },
  escalated: { icon: AlarmClock, color: 'coral' },
}

function BeforeAfter({ before, after }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative aspect-[4/3] select-none overflow-hidden">
      <img src={after} alt="After cleanup" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before cleanup" className="h-full w-full object-cover" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-1 bg-white shadow-[0_0_0_2px_#17324d]" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white text-sm font-extrabold shadow-popsm" style={{ left: 2 }}>
          ⇆
        </div>
      </div>
      <span className="absolute bottom-3 left-3 rounded-full border-2 border-ink bg-coral-500 px-2.5 py-0.5 text-xs font-extrabold uppercase text-white">Before</span>
      <span className="absolute bottom-3 right-3 rounded-full border-2 border-ink bg-leaf-500 px-2.5 py-0.5 text-xs font-extrabold uppercase text-white">After</span>
      <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(+e.target.value)} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" aria-label="Compare before and after" />
    </div>
  )
}

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reports, me, userById, confirmSeen, startWork, submitCleanup } = useStore()
  const report = reports.find((r) => r.id === id)
  const [cleanOpen, setCleanOpen] = useState(false)

  if (!report) return <EmptyState icon={Search} color="sky" title="Report not found" text="It may have been removed by a moderator." action={<Link to="/feed" className="btn btn-primary">Back to feed</Link>} />

  const author = userById(report.createdBy)
  const cleaner = report.cleanup ? userById(report.cleanup.by) : null
  const p = priority(report)
  const esc = escalation(report)
  const dept = DEPARTMENTS[report.department]
  const own = report.createdBy === me.id
  const already = report.seenBy.includes(me.id)
  const isDeptOfficer = me.role === 'govt' && me.status === 'active' && me.org?.department === report.department
  const open = report.status !== 'cleaned'

  const timeline = [...report.timeline]
  if (esc.overdue) {
    const windowMs = Math.max(6, report.ai.urgency_hours || 48) * 3600e3
    for (let lvl = 1; lvl <= esc.level; lvl++)
      timeline.push({ type: 'escalated', at: esc.dueAt + (lvl - 1) * windowMs, text: `No action in time. Escalated to ${officerFor(report.department, report.ward, lvl)}` })
  }
  timeline.sort((a, b) => a.at - b.at)

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 font-extrabold text-ink/55 hover:text-ink">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="card overflow-hidden">
            {report.cleanup ? <BeforeAfter before={report.photo} after={report.cleanup.photo} /> : <img src={report.photo} alt={report.ai.title} className="aspect-[4/3] w-full object-cover" />}
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <LevelChip level={p.level} />
                <StatusChip status={report.status} />
                <span className="chip bg-grape-100 text-grape-600"><Sparkles size={12} /> {report.ai.source === 'gemini' ? 'Gemini' : 'Demo AI'}</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight">{report.ai.title}</h1>
              <p className="font-semibold text-ink/60">{report.ai.summary}</p>
              {cleaner && <CleanedRibbon cleaner={cleaner} className="w-fit" />}
              <div className="flex items-center gap-3 pt-1">
                <UserAvatar user={author} size={36} />
                <div className="text-sm font-bold text-ink/60">
                  Reported by <span className="text-ink">{author?.name}</span> · {timeAgo(report.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {open && (
            <div className="grid gap-3 sm:grid-cols-2">
              <motion.button whileTap={{ scale: 0.97 }} disabled={own || already} onClick={() => confirmSeen(report.id)} className="btn btn-sun">
                <Eye size={20} /> {own ? 'Your report' : already ? 'You backed this' : 'I saw this too'} · {seenCount(report)}
              </motion.button>
              <button className="btn btn-primary" onClick={() => setCleanOpen(true)}>
                <Sparkles size={20} /> I cleaned it!
              </button>
              {isDeptOfficer && report.status === 'assigned' && (
                <button className="btn btn-sky sm:col-span-2" onClick={() => startWork(report.id)}>
                  <Hammer size={20} /> Acknowledge & start work
                </button>
              )}
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-4 text-xl font-extrabold">Timeline</h2>
            <ol className="relative space-y-4 border-l-2 border-dashed border-ink/15 pl-6">
              {timeline.map((t, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative">
                  <IconBox icon={(TL_ICON[t.type] || TL_ICON.sent).icon} color={(TL_ICON[t.type] || TL_ICON.sent).color} size="sm" round className="absolute -left-[42px] -top-1" />
                  <div className="font-bold">{t.text}</div>
                  <div className="text-xs font-bold text-ink/45">{new Date(t.at).toLocaleString()}</div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          {esc.overdue && (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card border-coral-500 bg-coral-100 p-5">
              <div className="flex items-center gap-2 font-display text-xl font-extrabold text-coral-600">
                <AlarmClock size={22} /> Overdue by {duration(esc.overdueMs)}
              </div>
              <p className="mt-1 text-sm font-bold text-ink/70">
                The department was asked to act within {report.ai.urgency_hours} hours. It's now escalated to <b>{officerFor(report.department, report.ward, esc.level)}</b>.
              </p>
            </motion.div>
          )}

          <div className="card p-5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink/45">Responsible</div>
            <div className="mt-2 flex items-center gap-3">
              <IconBox icon={dept.icon} color={dept.color} size="lg" className="!h-12 !w-12" />
              <div className="min-w-0">
                <div className="font-display text-lg font-extrabold leading-tight">{officerFor(report.department, report.ward)}</div>
                <div className="text-sm font-bold text-ink/55">{dept.name}</div>
              </div>
            </div>
            <details className="mt-3 rounded-2xl border-2 border-ink/10 p-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold"><Mail size={17} /> Complaint that was sent</summary>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold text-ink/65">{report.ai.complaint_text}</p>
            </details>
          </div>

          <div className="card space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-xl font-extrabold"><Bot size={22} /> AI assessment</h2>
            <div>
              <div className="mb-1.5 flex justify-between text-sm font-extrabold"><span>Severity</span><span>{report.ai.severity}/10</span></div>
              <SeverityMeter value={report.ai.severity} />
            </div>
            <Row label="Waste" value={report.ai.waste_types.join(', ')} />
            <Row label="Amount" value={report.ai.volume} />
            <Row label="Risks" value={report.ai.hazards.join(', ') || 'None noted'} />
            <Row label="Suggested fix" value={report.ai.recommended_action} />
            <Row label="Deadline" value={`${report.ai.urgency_hours} hours`} />
          </div>

          <div className="card overflow-hidden">
            <MiniMap report={report} className="h-48" />
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-ink/60">
                <MapPin size={16} className="shrink-0" />
                <span className="truncate">{report.landmark || `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}</span>
              </div>
              <a className="btn btn-white btn-sm shrink-0" target="_blank" rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`"${report.ai.title}" has been waiting ${timeAgo(report.createdAt).replace(' ago', '')}. ${seenCount(report)} people reported it. Help push it on SaafSnap: ${window.location.origin}/r/${report.id}`)}`}>
                <Share2 size={16} /> Share
              </a>
            </div>
          </div>

          {report.cleanup?.verification && (
            <div className="card p-5">
              <h2 className="text-xl font-extrabold">Cleanup proof check</h2>
              <TrustList checks={report.cleanup.verification.checks} />
            </div>
          )}
        </div>
      </div>

      <CleanupModal open={cleanOpen} onClose={() => setCleanOpen(false)} report={report} onSubmit={submitCleanup} />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 font-extrabold text-ink/45">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function TrustList({ checks }) {
  return (
    <ul className="mt-3 space-y-2">
      {checks.map((c, i) => (
        <motion.li key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.15 }}
          className={`flex items-start gap-3 rounded-2xl border-2 p-3 ${c.pass ? 'border-leaf-400 bg-leaf-50' : 'border-coral-400 bg-coral-100'}`}>
          {c.pass ? <CheckCircle2 className="mt-0.5 shrink-0 text-leaf-600" size={20} /> : <XCircle className="mt-0.5 shrink-0 text-coral-600" size={20} />}
          <div>
            <div className="font-extrabold">{c.label}</div>
            {c.detail && <div className="text-xs font-bold text-ink/55">{c.detail}</div>}
          </div>
        </motion.li>
      ))}
    </ul>
  )
}

function CleanupModal({ open, onClose, report, onSubmit }) {
  const [stage, setStage] = useState('pick')
  const [photo, setPhoto] = useState(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const close = () => {
    onClose()
    setTimeout(() => { setStage('pick'); setPhoto(null); setFile(null); setResult(null); setError('') }, 250)
  }

  const pick = async (f) => {
    setError('')
    try {
      setPhoto(await fileToDataUrl(f))
      setFile(f)
    } catch (e) {
      setError(e.message)
    }
  }

  const verify = async () => {
    setStage('verifying')
    const [exif, here] = await Promise.all([readExif(file), getPosition(6000)])
    const v = await verifyCleanup({ beforeUrl: report.photo, afterUrl: photo, exif, here, report })
    setResult(v)
    setStage('result')
    if (v.verified) {
      setTimeout(() => {
        onSubmit(report.id, { photo, verification: v })
        close()
      }, 1600)
    } else onSubmit(report.id, { photo, verification: v })
  }

  return (
    <Modal open={open} onClose={stage === 'verifying' ? undefined : close}>
      <h2 className="pr-8 text-2xl font-extrabold">Upload cleanup proof</h2>
      <p className="mb-4 mt-1 text-sm font-semibold text-ink/55">Take an "after" photo from the same spot. AI checks it's real, recent, at this place and actually clean.</p>
      <AnimatePresence mode="wait">
        {stage === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {photo ? (
              <div className="grid grid-cols-2 gap-2">
                <figure>
                  <img src={report.photo} alt="" className="aspect-square w-full rounded-2xl border-2 border-ink object-cover" />
                  <figcaption className="mt-1 text-center text-xs font-extrabold text-coral-600">BEFORE</figcaption>
                </figure>
                <figure>
                  <img src={photo} alt="" className="aspect-square w-full rounded-2xl border-2 border-ink object-cover" />
                  <figcaption className="mt-1 text-center text-xs font-extrabold text-leaf-600">AFTER</figcaption>
                </figure>
              </div>
            ) : (
              <PhotoPicker onPick={pick} title="Snap the clean spot" hint="Stand where the original photo was taken." />
            )}
            {error && <div className="rounded-2xl bg-coral-100 px-4 py-2 text-sm font-bold text-coral-600">{error}</div>}
            {photo && (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-white" onClick={() => setPhoto(null)}><Camera size={18} /> Retake</button>
                <button className="btn btn-primary" onClick={verify}><Send size={18} /> Verify</button>
              </div>
            )}
          </motion.div>
        )}
        {stage === 'verifying' && (
          <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AiScanner image={photo} title="Checking your proof…" steps={['Checking photo is real, not AI-made', 'Matching it with the original spot', 'Checking the location', 'Measuring how clean it is']} />
          </motion.div>
        )}
        {stage === 'result' && result && (
          <motion.div key="r" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={`rounded-2xl p-4 text-center ${result.verified ? 'bg-leaf-100' : 'bg-coral-100'}`}>
              <div className="flex justify-center">
                <IconBox icon={result.verified ? PartyPopper : SearchX} color={result.verified ? 'leaf' : 'coral'} size="lg" />
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold">{result.verified ? 'Verified!' : 'Not accepted yet'}</div>
              <div className="text-sm font-bold text-ink/60">{result.notes}</div>
            </div>
            <TrustList checks={result.checks} />
            {!result.verified && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn btn-white" onClick={close}><Flag size={18} /> Close</button>
                <button className="btn btn-primary" onClick={() => { setPhoto(null); setStage('pick') }}><Camera size={18} /> Try again</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
