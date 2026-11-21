import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'

// Pill-bar chart where each bar is topped by an animated sticker instead of a number.
export default function LeaderChart({ items, unit = 'cleanups' }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="flex h-[300px] items-end justify-around gap-1.5 pt-14 sm:h-[360px] sm:gap-4">
      {items.map((it, i) => {
        const h = 16 + (it.value / max) * 76
        return (
          <div key={it.key} className="flex h-full min-w-0 max-w-[120px] flex-1 flex-col items-center justify-end">
            <div className="relative flex w-full flex-1 items-end justify-center">
              <motion.div
                className="relative w-[72%] min-w-[40px] max-w-[84px] rounded-full border-2 border-ink"
                style={{ background: `linear-gradient(to top, ${it.color}, ${it.color}88)`, boxShadow: '0 4px 0 #17324d' }}
                initial={{ height: '0%' }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 90, damping: 14 }}
              >
                <span className="absolute inset-y-6 left-[18%] w-[14%] rounded-full bg-white/35" />
                <motion.div
                  className="absolute left-1/2 top-0 grid place-items-center rounded-full border-2 border-ink bg-white"
                  style={{ x: '-50%', y: '-50%', width: 'clamp(52px, 120%, 92px)', aspectRatio: '1', boxShadow: '0 4px 0 #17324d' }}
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.55 + i * 0.12, type: 'spring', stiffness: 260, damping: 12 }}
                  whileHover={{ scale: 1.12, rotate: [0, -6, 6, 0] }}
                >
                  {it.sticker}
                  {i === 0 && it.value > 0 && (
                    <motion.span className="absolute -top-4 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-sun-400 text-ink" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 + i * 0.12 }}>
                      <Crown size={15} strokeWidth={2.6} />
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
            </div>
            <div className="mt-3 w-full text-center">
              <div className="truncate px-0.5 text-xs font-extrabold leading-tight sm:text-sm" title={it.label}>{it.label}</div>
              <div className="text-[11px] font-bold text-ink/50">
                {it.value} {unit}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
