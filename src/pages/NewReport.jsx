import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Crosshair, MapPin, RefreshCw, Send, Sparkles, AlertTriangle, Share2, Camera, FileText, Clock, Package, Trees, Eye, Mail } from 'lucide-react'
import { useStore } from '../lib/store'
import { analyzeReport } from '../lib/ai'
import { fileToDataUrl, readExif, LOCATION_FIX } from '../lib/image'
import { DEPARTMENTS } from '../lib/departments'
import { findDuplicate, priority } from '../lib/priority'
import PhotoPicker from '../components/PhotoPicker'
import AiScanner from '../components/AiScanner'
import { PickMap } from '../components/MapView'
import { SeverityMeter, Spinner, LevelChip, IconBox } from '../components/ui'
import { Confetti } from '../components/Celebration'

const SCAN_STEPS = ['Looking at the photo', 'Identifying the waste', 'Estimating severity and risks', 'Finding the responsible officer', 'Drafting your complaint']
const ENV_LABEL = { road: 'Road / street', river: 'River / ghat', pond: 'Pond / lake', drain: 'Drain / canal', market: 'Market', park: 'Park', residential: 'Residential area', other: 'Other' }

export default function NewReport() {
  const { reports, createReport, confirmSeen, here, locPerm, refreshLocation } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState('photo')
  const [photo, setPhoto] = useState(null)
  const [exif, setExif] = useState(null)
  const fresh = here && Date.now() - here.at < 5 * 60000
  const [loc, setLoc] = useState(fresh ? { ...here, source: 'gps' } : null)
  const [locState, setLocState] = useState(fresh ? 'ok' : 'locating')
  const [landmark, setLandmark] = useState('')
  const [ai, setAi] = useState(null)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [ignoreDup, setIgnoreDup] = useState(false)

  const locate = async () => {
    setLocState((s) => (s === 'ok' ? s : 'locating'))
    const p = await refreshLocation()
    if (p) {
      setLoc((prev) => (prev?.source === 'manual' ? prev : { ...p, source: 'gps' }))
      setLocState('ok')
    } else setLocState((s) => (s === 'ok' ? s : 'failed'))
  }
  // Locate once when the page opens; later refreshes come from the "Use my location" button.
  useEffect(() => {
    locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pick = async (file) => {
    setError('')
    try {
      const [dataUrl, ex] = await Promise.all([fileToDataUrl(file), readExif(file)])
      setPhoto(dataUrl)
      setExif(ex)
      if (ex.lat != null && (!loc || loc.source !== 'gps')) {
        setLoc({ lat: ex.lat, lng: ex.lng, source: 'photo' })
        setLocState('ok')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const analyze = async () => {
    setStep('analyzing')
    setError('')
    try {
      const result = await analyzeReport(photo, { location: loc, landmark })
      setAi(result)
      setStep('result')
    } catch (e) {
      setError(e.message)
      setStep('photo')
    }
  }

  const duplicate = useMemo(() => {
    if (ignoreDup) return null
    return findDuplicate(loc, reports)
  }, [loc, reports, ignoreDup])

  const [sending, setSending] = useState(false)
  const submit = async () => {
    setSending(true)
    try {
      const r = await createReport({ photo, location: { lat: loc.lat, lng: loc.lng }, landmark, ai, exif })
      setCreated({ ...r, ai })
      setStep('done')
    } catch {
      /* the store shows the error toast */
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setStep('photo')
    setPhoto(null)
    setAi(null)
    setExif(null)
    setLandmark('')
    setCreated(null)
    setIgnoreDup(false)
  }

  const dept = ai ? DEPARTMENTS[ai.primary_category] : null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        {step !== 'done' && (
          <button onClick={() => (step === 'result' ? setStep('photo') : navigate(-1))} className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink/10 bg-white hover:border-ink" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-3xl font-extrabold">{step === 'done' ? 'Complaint sent!' : 'Snap a spot'}</h1>
      </div>

      <AnimatePresence mode="wait">
        {step === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {!photo ? (
              <PhotoPicker onPick={pick} />
            ) : (
              <div className="card overflow-hidden">
                <div className="relative">
                  <img src={photo} alt="Your photo" className="aspect-[4/3] w-full object-cover" />
                  <button onClick={() => setPhoto(null)} className="btn btn-white btn-sm absolute right-3 top-3">
                    <RefreshCw size={16} /> Retake
                  </button>
                  {exif?.make && (
                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1 text-xs font-extrabold"><Camera size={13} /> {exif.make} {exif.model}</span>
                  )}
                </div>
              </div>
            )}

            <div className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-display text-lg font-extrabold">
                  <MapPin size={20} className="text-coral-500" /> Location
                </div>
                <button onClick={locate} className="btn btn-white btn-sm">
                  {locState === 'locating' ? <Spinner size={14} /> : <Crosshair size={16} />} Use my location
                </button>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink/55">
                {locState === 'locating' && 'Finding where you are…'}
                {locState === 'ok' && loc && `${loc.source === 'gps' ? 'Your GPS location' : loc.source === 'photo' ? 'Location from the photo' : 'Pinned on the map'} · drag the pin or tap the map to adjust.`}
                {locState === 'failed' && !loc &&
                  (locPerm === 'denied'
                    ? `Location is blocked. ${LOCATION_FIX} Or tap the map to drop a pin.`
                    : "Couldn't get your location. Tap on the map to drop a pin where the garbage is.")}
              </p>
              <PickMap value={loc} onChange={(v) => { setLoc(v); setLocState('ok') }} className="mt-3 h-56 overflow-hidden rounded-2xl border-2 border-ink" />
              <input className="input mt-3" maxLength={120} placeholder="Landmark (optional), e.g. Behind Sealdah station gate 2" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
            </div>

            {error && <div className="rounded-2xl bg-coral-100 px-4 py-3 font-bold text-coral-600">{error}</div>}

            <button className="btn btn-primary w-full text-xl" disabled={!photo || !loc} onClick={analyze}>
              <Sparkles size={22} /> Analyse with AI
            </button>
            {(!photo || !loc) && <p className="text-center text-sm font-bold text-ink/45">{!photo ? 'Add a photo to continue' : 'Set the location to continue'}</p>}
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="scan" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <AiScanner image={photo} steps={SCAN_STEPS} />
          </motion.div>
        )}

        {step === 'result' && ai && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {!ai.is_garbage_scene ? (
              <div className="card p-6 text-center">
                <AlertTriangle size={44} className="mx-auto text-amber-500" />
                <h2 className="mt-2 text-2xl font-extrabold">Hmm, we don't see garbage here</h2>
                <p className="mt-1 font-semibold text-ink/60">The AI couldn't find litter or pollution in this photo. Try again with the mess clearly in frame.</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button className="btn btn-primary flex-1" onClick={reset}>
                    <Camera size={20} /> Retake photo
                  </button>
                  <button className="btn btn-white flex-1" onClick={() => setAi({ ...ai, is_garbage_scene: true, user_override: true })}>
                    It is garbage, continue
                  </button>
                </div>
              </div>
            ) : (
              <>
                {duplicate && (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card border-sun-500 bg-sun-100 p-4">
                    <div className="flex gap-3">
                      <img src={duplicate.r.photo} alt="" className="h-20 w-20 shrink-0 rounded-2xl border-2 border-ink object-cover" />
                      <div className="min-w-0">
                        <div className="font-display text-lg font-extrabold">Already reported {Math.round(duplicate.d)} m away!</div>
                        <div className="truncate text-sm font-bold text-ink/60">"{duplicate.r.ai.title}"</div>
                        <div className="mt-1 text-sm font-semibold text-ink/60">Backing it makes the spot redder on the map, which means more pressure.</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="btn btn-sun btn-sm" onClick={() => { confirmSeen(duplicate.r.id); navigate(`/r/${duplicate.r.id}`) }}><Eye size={16} /> Back that report</button>
                      <button className="btn btn-white btn-sm" onClick={() => setIgnoreDup(true)}>It's a new spot</button>
                    </div>
                  </motion.div>
                )}

                <div className="card overflow-hidden">
                  <div className="relative">
                    <img src={photo} alt="" className="aspect-[16/9] w-full object-cover" />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-extrabold shadow-popsm">
                      <Sparkles size={14} className="text-grape-500" />
                      {ai.source === 'gemini' ? 'Gemini analysis' : 'Demo AI analysis'} · {Math.round(ai.confidence * 100)}% sure
                    </div>
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="text-2xl font-extrabold leading-tight">{ai.title}</h2>
                      <p className="mt-1 font-semibold text-ink/60">{ai.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.waste_types.map((w, i) => (
                        <motion.span key={w} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + i * 0.06, type: 'spring' }} className="chip border-2 border-ink/10 bg-leaf-50 text-leaf-700">
                          {w}
                        </motion.span>
                      ))}
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-sm font-extrabold">
                        <span>Severity</span>
                        <span>{ai.severity}/10</span>
                      </div>
                      <SeverityMeter value={ai.severity} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Fact icon={<Package size={18} />} label="Amount" value={ai.volume.split(' (')[0]} />
                      <Fact icon={<Trees size={18} />} label="Place" value={ENV_LABEL[ai.environment]} />
                      <Fact icon={<Clock size={18} />} label="Fix within" value={`${ai.urgency_hours}h`} />
                    </div>
                    {ai.hazards.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ai.hazards.map((h) => (
                          <span key={h} className="chip bg-coral-100 text-coral-600"><AlertTriangle size={12} strokeWidth={2.8} /> {h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5" style={{ background: `${dept.color}14` }}>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-ink/50">AI will send this complaint to</div>
                  <div className="mt-2 flex items-center gap-3">
                    <IconBox icon={dept.icon} color={dept.color} size="lg" className="shadow-popsm" />
                    <div className="min-w-0">
                      <div className="font-display text-xl font-extrabold leading-tight">{ai.officer}</div>
                      <div className="text-sm font-bold text-ink/60">{dept.name}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink/60">Why: {dept.covers.toLowerCase()} are handled by this department.</p>
                  <details className="group mt-3 rounded-2xl border-2 border-ink/10 bg-white p-3">
                    <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold">
                      <FileText size={18} /> Read the complaint letter
                    </summary>
                    <p className="mt-2 whitespace-pre-line text-sm font-semibold text-ink/70">{ai.complaint_text}</p>
                  </details>
                </motion.div>

                {ai.fallbackReason && <p className="text-center text-xs font-bold text-ink/45">Gemini was unreachable ({ai.fallbackReason}), so the offline analyser was used.</p>}

                <button className="btn btn-primary w-full text-xl" onClick={submit} disabled={!!duplicate || sending}>
                  {sending ? <Spinner /> : <Send size={22} />} {sending ? 'Sending…' : 'Send complaint'}
                </button>
                {duplicate && <p className="text-center text-sm font-bold text-ink/45">Choose an option above first.</p>}
              </>
            )}
          </motion.div>
        )}

        {step === 'done' && created && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card relative overflow-hidden p-6 text-center sm:p-8">
            <Confetti />
            <div className="relative mx-auto h-36 w-full max-w-xs">
              <motion.div
                className="absolute left-0 top-12"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: 220, y: -40, rotate: 15, opacity: [1, 1, 0] }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
              >
                <IconBox icon={Mail} color="sun" size="lg" />
              </motion.div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.2, duration: 0.5 }} className="absolute right-0 top-4">
                <IconBox icon={DEPARTMENTS[created.department].icon} color={DEPARTMENTS[created.department].color} size="xl" className="!h-24 !w-24 shadow-pop" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-extrabold">Delivered to the officer</h2>
            <p className="mt-2 font-semibold text-ink/60">
              <b>{created.ai.officer}</b> has your complaint. If they don't act in {created.ai.urgency_hours} hours, SaafSnap escalates it automatically.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <LevelChip level={priority(created).level} />
              <span className="rounded-full border-2 border-ink bg-sun-400 px-3 py-0.5 font-display font-extrabold">+10 points</span>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Link to={`/r/${created.id}`} className="btn btn-primary">View report</Link>
              <a className="btn btn-white" target="_blank" rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`I just reported "${created.ai.title}" on SaafSnap. Help push it up so it gets cleaned: ${window.location.origin}/r/${created.id}`)}`}>
                <Share2 size={18} /> Share
              </a>
              <button className="btn btn-white" onClick={reset}><Camera size={18} /> Snap another</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Fact({ icon, label, value }) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-cream p-2.5">
      <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-white text-ink/60">{icon}</div>
      <div className="text-[11px] font-extrabold uppercase text-ink/45">{label}</div>
      <div className="truncate text-sm font-extrabold">{value}</div>
    </div>
  )
}
