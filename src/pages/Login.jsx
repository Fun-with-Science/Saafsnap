import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, User, HandHeart, Landmark, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { useStore } from '../lib/store'
import { pageMotion, Spinner, IconBox } from '../components/ui'
import { DEMO_PASSWORD, ADMIN_PASSWORD } from '../lib/seed'
import GoogleButton from '../components/GoogleButton'

const DEMO = [
  { email: 'citizen@saafsnap.demo', password: DEMO_PASSWORD, label: 'Citizen', icon: User, color: 'leaf', tone: 'bg-leaf-50' },
  { email: 'greenganga@saafsnap.demo', password: DEMO_PASSWORD, label: 'NGO', icon: HandHeart, color: 'sky', tone: 'bg-sky2-100/60' },
  { email: 'swm@saafsnap.demo', password: DEMO_PASSWORD, label: 'Govt officer', icon: Landmark, color: 'sun', tone: 'bg-sun-100/70' },
  { email: 'admin@saafsnap.demo', password: ADMIN_PASSWORD, label: 'Admin', icon: ShieldCheck, color: 'grape', tone: 'bg-grape-100/70' },
]

export default function Login() {
  const { login, dataMode } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const goNext = (user) => navigate(location.state?.from || (user.role === 'admin' ? '/admin' : user.role === 'govt' ? '/desk' : '/feed'), { replace: true })

  const attempt = async (em, pw) => {
    setError('')
    setBusy(true)
    try {
      goNext(await login(em, pw))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    attempt(email, password)
  }

  return (
    <motion.div {...pageMotion} className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo withText size={44} />
        </Link>
        <div className="card p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold">Welcome back</h1>
          <p className="mt-1 font-semibold text-ink/55">Log in to report and track spots.</p>
          <div className="mt-6">
            <GoogleButton />
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" className="input pr-12" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-ink/50 hover:bg-ink/5" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <motion.div initial={{ x: -8 }} animate={{ x: [8, -6, 4, 0] }} className="rounded-2xl bg-coral-100 px-4 py-2.5 text-sm font-bold text-coral-600">
                {error}
              </motion.div>
            )}
            <button className="btn btn-primary w-full" disabled={busy}>
              {busy ? <Spinner /> : <LogIn size={20} />} Log in
            </button>
          </form>
          <p className="mt-5 text-center font-semibold text-ink/60">
            New here? <Link to="/signup" className="font-extrabold text-leaf-600 underline decoration-2 underline-offset-4">Create an account</Link>
          </p>
        </div>

        {dataMode === 'local' && (
        <div className="card-soft mt-5 p-5">
          <div className="text-sm font-extrabold uppercase tracking-wider text-ink/45">Quick demo login (offline demo)</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <button key={d.email} disabled={busy} onClick={() => attempt(d.email, d.password)}
                className={`flex items-center gap-2 rounded-2xl border-2 border-ink/10 px-3 py-2.5 text-left font-bold transition hover:-translate-y-0.5 hover:border-ink ${d.tone}`}>
                <IconBox icon={d.icon} color={d.color} size="sm" /> {d.label}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </motion.div>
  )
}
