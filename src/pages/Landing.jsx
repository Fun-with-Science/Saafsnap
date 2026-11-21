import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Sparkles, Map, ShieldCheck, ArrowRight, BadgeCheck, CupSoda, ShoppingBag, Recycle, Leaf, Trophy } from 'lucide-react'
import Logo from '../components/Logo'
import { GovtMascot, OrgLogo, CitizenHero } from '../components/Stickers'
import { useStore } from '../lib/store'
import { pageMotion, IconBox } from '../components/ui'

const STEPS = [
  { icon: Camera, color: 'bg-leaf-500', title: 'Snap it', text: 'See garbage, a dirty river or a choked drain? Click a photo, just like posting on Instagram.' },
  { icon: Sparkles, color: 'bg-grape-500', title: 'AI routes it', text: 'Gemini checks what kind of waste it is, how serious it is, and sends the complaint to the exact officer responsible.' },
  { icon: Map, color: 'bg-coral-500', title: 'Map shows pressure', text: 'More people report a spot, the redder it gets on the public map. Everyone can see who is acting and who is not.' },
  { icon: BadgeCheck, color: 'bg-sky2-500', title: 'Clean & get credit', text: 'Govt, NGOs or anyone who cleans uploads proof. AI checks it is real, then their name and badge go on the spot.' },
]

const FLOAT = [
  { icon: CupSoda, color: 'coral', x: '4%', y: '16%', d: 0 },
  { icon: ShoppingBag, color: 'sky', x: '86%', y: '12%', d: 0.6 },
  { icon: Recycle, color: 'grape', x: '84%', y: '74%', d: 1.2 },
  { icon: Leaf, color: 'leaf', x: '6%', y: '74%', d: 0.3 },
  { icon: Sparkles, color: 'sun', x: '46%', y: '2%', d: 0.9 },
]

export default function Landing() {
  const { me } = useStore()
  const navigate = useNavigate()
  const start = () => navigate(me ? '/feed' : '/signup')

  return (
    <motion.div {...pageMotion} className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Logo withText />
        <div className="flex items-center gap-2">
          {me ? (
            <Link to="/feed" className="btn btn-primary btn-sm">Open app</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-6 md:grid-cols-2 md:px-8 md:pt-14">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-extrabold shadow-popsm">
            <Sparkles size={16} className="text-grape-500" /> Powered by Gemini AI
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
            Snap the mess.
            <br />
            <span className="relative inline-block text-leaf-500">
              We'll get it cleaned.
              <motion.svg viewBox="0 0 300 20" className="absolute -bottom-3 left-0 w-full" initial={{ pathLength: 0 }}>
                <motion.path d="M4 14 Q150 0 296 12" stroke="#fbbf24" strokeWidth="7" fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
              </motion.svg>
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 max-w-lg text-lg font-semibold text-ink/65">
            One photo of garbage, a dirty pond or a blocked drain. Our AI figures out what it is, how urgent it is, and complains to the right officer for you. The whole city watches until it's clean.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
            <button onClick={start} className="btn btn-primary w-full max-w-xs text-xl sm:w-auto">
              <Camera size={22} /> Start snapping
            </button>
            <Link to="/login" className="btn btn-white w-full max-w-xs text-xl sm:w-auto">
              Try the demo <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          {FLOAT.map((f) => (
            <motion.span key={f.x} className="absolute z-10" style={{ left: f.x, top: f.y }}
              animate={{ y: [0, -14, 0], rotate: [0, 10, -6, 0] }} transition={{ duration: 3.4, delay: f.d, repeat: Infinity, ease: 'easeInOut' }}>
              <IconBox icon={f.icon} color={f.color} className="shadow-popsm" />
            </motion.span>
          ))}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.2 }}
            className="card absolute inset-[12%] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-leaf-50 to-sky2-100 p-6">
            <div className="flex items-end gap-3">
              <div className="flex flex-col items-center">
                <OrgLogo org={{ icon: 'waves', color: '#0ea5e9' }} size={62} animate />
                <span className="mt-1 text-xs font-extrabold text-ink/60">NGO</span>
              </div>
              <div className="flex flex-col items-center">
                <CitizenHero size={96} />
                <span className="text-xs font-extrabold text-ink/60">You</span>
              </div>
              <div className="flex flex-col items-center">
                <GovtMascot mood="sleepy" size={96} />
                <span className="mt-1 text-xs font-extrabold text-ink/60">Govt?</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-white py-1.5 pl-1.5 pr-4 text-center font-display text-lg font-bold shadow-popsm">
              <IconBox icon={Trophy} color="sun" size="sm" /> Who cleans first?
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <h2 className="mb-6 text-center text-3xl font-extrabold md:text-4xl">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }} whileHover={{ y: -4 }} className="card p-5">
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink text-white ${s.color}`}>
                  <s.icon size={24} strokeWidth={2.5} />
                </div>
                <span className="font-display text-4xl font-extrabold text-ink/15">0{i + 1}</span>
              </div>
              <h3 className="mt-3 text-2xl font-extrabold">{s.title}</h3>
              <p className="mt-1 font-semibold text-ink/60">{s.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="card mt-10 flex flex-col items-center gap-4 bg-ink p-8 text-center text-white md:flex-row md:text-left">
          <ShieldCheck size={48} className="shrink-0 text-leaf-400" />
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold">Verified, not just viral</h3>
            <p className="mt-1 font-semibold text-white/70">
              NGO and government accounts are checked by our team. Every cleanup photo is checked by AI for being real, recent and at the same spot, so nobody can fake credit.
            </p>
          </div>
          <button onClick={start} className="btn btn-sun w-full max-w-xs shrink-0 md:w-auto">Join now</button>
        </motion.div>
      </section>
      <footer className="pb-8 text-center text-sm font-bold text-ink/40">SaafSnap</footer>
    </motion.div>
  )
}
