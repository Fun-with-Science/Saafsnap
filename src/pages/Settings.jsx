import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, History, MapPin, Mail, UserRound, ShieldCheck, LogOut, Briefcase } from 'lucide-react'
import { useStore } from '../lib/store'
import { IconBox, Spinner } from '../components/ui'
import { ROLE } from './Profile'

const LOC_TEXT = { granted: 'On', prompt: 'Off', denied: 'Blocked in browser', unsupported: 'Not supported', unknown: 'Checking…' }

function Row({ icon, color, title, detail, to, onClick, right, danger }) {
  const body = (
    <>
      <IconBox icon={icon} color={color} size="sm" />
      <div className="min-w-0 flex-1 text-left">
        <div className={`font-extrabold ${danger ? 'text-coral-600' : ''}`}>{title}</div>
        {detail && <div className="truncate text-sm font-semibold text-ink/50">{detail}</div>}
      </div>
      {right ?? ((to || onClick) && !danger && <ChevronRight size={20} className="text-ink/40" />)}
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-ink/[0.03]'
  if (to) return <Link to={to} className={cls}>{body}</Link>
  if (onClick) return <button onClick={onClick} className={cls}>{body}</button>
  return <div className={cls}>{body}</div>
}

export default function Settings() {
  const { me, logout, locPerm, refreshLocation } = useStore()
  const navigate = useNavigate()
  const [locating, setLocating] = useState(false)

  const turnOnLocation = async () => {
    setLocating(true)
    await refreshLocation()
    setLocating(false)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink/10 bg-white hover:border-ink" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-extrabold">Settings</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <section>
          <h2 className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider text-ink/45">Your activity</h2>
          <div className="card divide-y-2 divide-ink/5 overflow-hidden">
            <Row icon={History} color="grape" title="Your activity" detail="Spots you reported, cleaned or backed" to="/settings/activity" />
            {me.role === 'govt' && <Row icon={Briefcase} color="sky" title="My desk" detail="Complaints for your department" to="/desk" />}
            {me.role === 'admin' && <Row icon={ShieldCheck} color="ink" title="Admin panel" detail="Verify organisations, moderate reports" to="/admin" />}
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider text-ink/45">Permissions</h2>
          <div className="card overflow-hidden">
            <Row
              icon={MapPin}
              color="coral"
              title="Location"
              detail={locPerm === 'denied' ? 'Allow it from the lock icon next to the website address' : LOC_TEXT[locPerm]}
              right={
                locPerm === 'prompt' ? (
                  <button className="btn btn-primary btn-sm" onClick={turnOnLocation} disabled={locating}>
                    {locating ? <Spinner size={14} /> : null} Turn on
                  </button>
                ) : (
                  <span className={`chip ${locPerm === 'granted' ? 'bg-leaf-100 text-leaf-700' : 'bg-ink/5 text-ink/60'}`}>{LOC_TEXT[locPerm]}</span>
                )
              }
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider text-ink/45">Account</h2>
          <div className="card divide-y-2 divide-ink/5 overflow-hidden">
            <Row icon={UserRound} color="leaf" title={me.org?.name || me.name} detail={`${ROLE[me.role]}${me.role !== 'citizen' && me.role !== 'admin' ? ` · ${me.status === 'active' ? 'Verified' : 'Verification pending'}` : ''}`} />
            {me.email && <Row icon={Mail} color="sky" title="Email" detail={me.email} />}
            <Row icon={LogOut} color="coral" title="Log out" danger onClick={async () => { await logout(); navigate('/') }} />
          </div>
        </section>
      </motion.div>
    </div>
  )
}
