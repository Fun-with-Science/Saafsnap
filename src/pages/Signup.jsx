import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Eye, EyeOff, UserPlus, Upload, User, HandHeart, Landmark, Users, MailCheck, Hourglass } from 'lucide-react'
import Logo from '../components/Logo'
import { useStore } from '../lib/store'
import { DEPT_LIST } from '../lib/departments'
import { ORG_COLORS, ORG_ICON_KEYS, OrgLogo } from '../components/Stickers'
import { pageMotion, Spinner, IconBox } from '../components/ui'

const ROLES = [
  { id: 'citizen', icon: User, color: 'leaf', title: 'Citizen', text: 'Report spots, back others, clean up and earn badges.', tone: 'bg-leaf-100', verify: false },
  { id: 'ngo', icon: HandHeart, color: 'sky', title: 'NGO', text: 'Run cleanup drives and get public credit on the map.', tone: 'bg-sky2-100', verify: true },
  { id: 'govt', icon: Landmark, color: 'sun', title: 'Government', text: 'Receive complaints for your department and close them.', tone: 'bg-sun-100', verify: true },
  { id: 'group', icon: Users, color: 'grape', title: 'Group / Other', text: 'Schools, clubs, RWAs, companies doing cleanups.', tone: 'bg-grape-100', verify: true },
]

export default function Signup() {
  const { signup } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '', regId: '', department: 'swm', city: 'Kolkata', color: ORG_COLORS[0], icon: 'leaf', proof: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const r = ROLES.find((x) => x.id === role)
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password needs at least 6 characters.')
    setBusy(true)
    try {
      const org =
        role === 'citizen'
          ? null
          : role === 'govt'
            ? { name: DEPT_LIST.find((d) => d.id === form.department).name, department: form.department, regId: form.regId, city: form.city, proof: form.proof }
            : { name: form.orgName, regId: form.regId, city: form.city, color: form.color, icon: form.icon, proof: form.proof }
      const { user, needsConfirm } = await signup({ name: role === 'citizen' || role === 'govt' ? form.name : form.orgName, email: form.email, password: form.password, role, org })
      if (needsConfirm) setDone({ confirm: true, email: form.email })
      else if (user?.status === 'pending') setDone(user)
      else navigate('/feed', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done?.confirm)
    return (
      <motion.div {...pageMotion} className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <motion.div className="flex justify-center" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <IconBox icon={MailCheck} color="sky" size="xl" />
          </motion.div>
          <h1 className="mt-3 text-3xl font-extrabold">Check your email</h1>
          <p className="mt-2 font-semibold text-ink/60">
            We sent a confirmation link to <b>{done.email}</b>. Click it, then log in.
            {role !== 'citizen' && ' Your organisation will then wait for verification by our team.'}
          </p>
          <Link to="/login" className="btn btn-primary mt-6 w-full">Go to login</Link>
        </div>
      </motion.div>
    )

  if (done)
    return (
      <motion.div {...pageMotion} className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <motion.div className="flex justify-center" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <IconBox icon={Hourglass} color="sun" size="xl" />
          </motion.div>
          <h1 className="mt-3 text-3xl font-extrabold">Almost there!</h1>
          <p className="mt-2 font-semibold text-ink/60">
            Your {r.title} account has been created. Our team will verify <b>{done.org?.name}</b> using the ID you shared. Until then you can explore and report like a citizen.
          </p>
          <button className="btn btn-primary mt-6 w-full" onClick={() => navigate('/feed', { replace: true })}>
            Explore SaafSnap
          </button>
        </div>
      </motion.div>
    )

  return (
    <motion.div {...pageMotion} className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center">
      <div className="w-full max-w-xl">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo withText size={44} />
        </Link>
        <div className="card overflow-hidden p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            {[0, 1].map((i) => (
              <motion.div key={i} className="h-2 flex-1 rounded-full bg-ink/10">
                <motion.div className="h-full rounded-full bg-leaf-500" initial={false} animate={{ width: step >= i ? '100%' : '0%' }} transition={{ duration: 0.35 }} />
              </motion.div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-extrabold">Who are you?</h1>
                <p className="mt-1 font-semibold text-ink/55">Pick one. You can't change this later.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {ROLES.map((x, i) => (
                    <motion.button key={x.id} type="button" onClick={() => setRole(x.id)}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative rounded-3xl border-2 p-4 text-left transition ${role === x.id ? 'border-ink shadow-pop ' + x.tone : 'border-ink/10 bg-white hover:border-ink/40'}`}>
                      {role === x.id && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-leaf-500 text-white">
                          <Check size={16} strokeWidth={3} />
                        </motion.span>
                      )}
                      <IconBox icon={x.icon} color={x.color} />
                      <div className="mt-1 font-display text-xl font-extrabold">{x.title}</div>
                      <div className="text-sm font-semibold text-ink/60">{x.text}</div>
                      {x.verify && <div className="mt-2 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-extrabold text-ink/60">Needs verification</div>}
                    </motion.button>
                  ))}
                </div>
                <button className="btn btn-primary mt-6 w-full" disabled={!role} onClick={() => setStep(1)}>
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.form key="details" onSubmit={submit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1 text-sm font-extrabold text-ink/55 hover:text-ink">
                  <ArrowLeft size={16} /> Change role
                </button>
                <h1 className="flex items-center gap-3 text-3xl font-extrabold">
                  <IconBox icon={r.icon} color={r.color} /> {r.title} sign up
                </h1>

                {(role === 'citizen' || role === 'govt') && (
                  <div>
                    <label className="label" htmlFor="name">Your full name</label>
                    <input id="name" className="input" required value={form.name} onChange={upd('name')} placeholder="e.g. Ananya Roy" />
                  </div>
                )}
                {(role === 'ngo' || role === 'group') && (
                  <>
                    <div>
                      <label className="label" htmlFor="org">{role === 'ngo' ? 'NGO name' : 'Group name'}</label>
                      <input id="org" className="input" required value={form.orgName} onChange={upd('orgName')} placeholder={role === 'ngo' ? 'e.g. Green Ganga Collective' : 'e.g. Lake Town RWA'} />
                    </div>
                    <div>
                      <span className="label">Pick your logo</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <OrgLogo org={{ color: form.color, icon: form.icon, name: form.orgName }} size={56} />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {ORG_COLORS.map((c) => (
                              <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} aria-label={`Colour ${c}`}
                                className={`h-7 w-7 rounded-full border-2 ${form.color === c ? 'border-ink ring-2 ring-ink/20' : 'border-white'}`} style={{ background: c }} />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ORG_ICON_KEYS.map((k) => (
                              <button type="button" key={k} onClick={() => setForm({ ...form, icon: k })} aria-label={`Icon ${k}`}
                                className={`rounded-xl border-2 p-0.5 ${form.icon === k ? 'border-ink' : 'border-transparent'}`}>
                                <OrgLogo org={{ color: '#94a3b8', icon: k }} size={26} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {role === 'govt' && (
                  <div>
                    <label className="label" htmlFor="dept">Your department</label>
                    <select id="dept" className="input" value={form.department} onChange={upd('department')}>
                      {DEPT_LIST.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {r.verify && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="reg">{role === 'govt' ? 'Employee ID' : 'Registration no.'}</label>
                      <input id="reg" className="input" required value={form.regId} onChange={upd('regId')} placeholder={role === 'govt' ? 'EMP-1234' : 'NGO/WB/2024/0001'} />
                    </div>
                    <div>
                      <label className="label" htmlFor="city">City</label>
                      <input id="city" className="input" required value={form.city} onChange={upd('city')} />
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-ink/25 px-4 py-3 font-bold text-ink/60 hover:border-ink/50 sm:col-span-2">
                      <Upload size={18} />
                      <span className="truncate">{form.proof || 'Attach ID / registration proof (optional)'}</span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setForm({ ...form, proof: e.target.files?.[0]?.name || '' })} />
                    </label>
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="semail">Email</label>
                  <input id="semail" className="input" type="email" autoComplete="email" required value={form.email} onChange={upd('email')} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label" htmlFor="spass">Password</label>
                  <div className="relative">
                    <input id="spass" className="input pr-12" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={form.password} onChange={upd('password')} placeholder="At least 6 characters" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-ink/50 hover:bg-ink/5" aria-label={show ? 'Hide password' : 'Show password'}>
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <div className="rounded-2xl bg-coral-100 px-4 py-2.5 text-sm font-bold text-coral-600">{error}</div>}
                <button className="btn btn-primary w-full" disabled={busy}>
                  {busy ? <Spinner /> : <UserPlus size={20} />} Create account
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          <p className="mt-5 text-center font-semibold text-ink/60">
            Already have an account? <Link to="/login" className="font-extrabold text-leaf-600 underline decoration-2 underline-offset-4">Log in</Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
