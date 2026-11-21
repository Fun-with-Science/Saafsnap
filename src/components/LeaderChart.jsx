import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown } from 'lucide-react'

// Pill-bar chart where each bar is topped by an animated sticker instead of a number.
// Tapping a bar highlights it and shows the full name above the chart.
export default function LeaderChart({ items, unit = 'cleanups' }) {
  const [picked, setPicked] = useState(items[0]?.key)
  const max = Math.max(1, ...items.map((i) => i.value))
  const sel = items.find((i) => i.key === picked) || items[0]

  return (
    <div>
      <div className="flex h-12 items-center justify-center">
        <AnimatePresence mode="wait">
          {sel && (
            <motion.div
              key={sel.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="flex max-w-full items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 shadow-popsm"
            >
              <span className="h-3 w-3 shrink-0 rounded-full border-2 border-ink" style={{ background: sel.color }} />
              <span className="font-display text-base font-extrabold leading-tight sm:text-lg">{sel.label}</span>
              <span className="shrink-0 text-sm font-bold text-ink/55">· {sel.value} {unit}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-[300px] items-end justify-around gap-1.5 pt-12 sm:h-[340px] sm:gap-4">
        {items.map((it, i) => {
          const h = 16 + (it.value / max) * 76
          const on = it.key === sel?.key
          return (
            <button
              type="button"
              key={it.key}
              onClick={() => setPicked(it.key)}
              aria-pressed={on}
              aria-label={`${it.label}, ${it.value} ${unit}`}
              className="flex h-full min-w-0 max-w-[120px] flex-1 flex-col items-center justify-end outline-none"
            >
              <div className="relative flex w-full flex-1 items-end justify-center">
                <motion.div
                  className="relative w-[72%] min-w-[40px] max-w-[84px] rounded-full border-2 border-ink"
                  style={{ background: `linear-gradient(to top, ${it.color}, ${it.color}88)`, boxShadow: on ? `0 0 0 4px ${it.color}55, 0 4px 0 #17324d` : '0 4px 0 #17324d' }}
                  initial={{ height: '0%' }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 16 }}
                >
                  <span className="absolute inset-y-6 left-[18%] w-[14%] rounded-full bg-white/35" />
                  <motion.div
                    className="absolute left-1/2 top-0 grid place-items-center rounded-full border-2 border-ink bg-white p-[3px]"
                    style={{ x: '-50%', y: '-50%', width: 'clamp(52px, 120%, 92px)', aspectRatio: '1', boxShadow: '0 4px 0 #17324d' }}
                    initial={{ scale: 0.6, rotate: -25 }}
                    animate={{ scale: on ? 1.08 : 1, rotate: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 320, damping: 14 }}
                  >
                    {it.sticker}
                    {i === 0 && it.value > 0 && (
                      <motion.span className="absolute -top-4 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-sun-400 text-ink" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Crown size={15} strokeWidth={2.6} />
                      </motion.span>
                    )}
                  </motion.div>
                </motion.div>
              </div>
              <div className={`mt-3 w-full rounded-xl px-0.5 py-1 text-center transition ${on ? 'bg-ink text-white' : ''}`}>
                <div className="line-clamp-3 break-words text-[11px] font-extrabold leading-tight sm:text-sm">{it.label}</div>
                <div className={`text-[11px] font-bold ${on ? 'text-white/70' : 'text-ink/50'}`}>{it.value}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
