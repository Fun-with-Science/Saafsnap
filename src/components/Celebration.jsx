import { motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { Sparkles } from 'lucide-react'
import { Modal, IconBox } from './ui'

const CONFETTI = ['#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#fde047']

export function Confetti({ count = 36 }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37) % 100
        const delay = (i % 9) * 0.06
        return (
          <motion.span
            key={i}
            className="absolute top-0 block h-3 w-2 rounded-sm"
            style={{ left: `${left}%`, background: CONFETTI[i % CONFETTI.length] }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: 520, rotate: 360 + i * 40, opacity: [1, 1, 0], x: ((i % 5) - 2) * 30 }}
            transition={{ duration: 1.8 + (i % 4) * 0.3, delay, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

export default function Celebration() {
  const { celebration, clearCelebration } = useStore()
  const c = celebration
  return (
    <Modal open={!!c} onClose={clearCelebration}>
      {c && (
        <div className="relative text-center">
          <Confetti />
          {c.cleaned && (
            <>
              <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -12, 12, 0] }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
                <IconBox icon={Sparkles} color="leaf" size="xl" />
              </motion.div>
              <h2 className="mt-2 text-3xl font-extrabold">Spot cleaned!</h2>
              <p className="mt-1 text-ink/60">AI verified your proof for "{c.cleaned}". The map just turned green.</p>
              <div className="mt-3 inline-block rounded-full border-2 border-ink bg-sun-400 px-4 py-1 font-display text-lg font-extrabold">+{c.points} points</div>
            </>
          )}
          {c.badges?.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-extrabold uppercase tracking-wider text-ink/50">Badge unlocked</div>
              <div className="mt-3 flex flex-wrap justify-center gap-4">
                {c.badges.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
                    className="flex w-32 flex-col items-center"
                  >
                    <IconBox icon={b.icon} color={b.color} size="xl" round className="shadow-pop" />
                    <div className="mt-2 font-display text-lg font-extrabold">{b.name}</div>
                    <div className="text-xs font-semibold text-ink/55">{b.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <button className="btn btn-primary mt-6 w-full" onClick={clearCelebration}>
            Awesome!
          </button>
        </div>
      )}
    </Modal>
  )
}
