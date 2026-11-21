import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Leaf } from 'lucide-react'
import { LEVELS, STATUS } from '../lib/priority'

export function LevelChip({ level, className = '' }) {
  const l = LEVELS[level]
  return (
    <span className={`chip border-2 border-ink/10 ${l.bg} ${l.text} ${className}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
      {l.label}
    </span>
  )
}

export function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.assigned
  return <span className={`chip ${s.tone}`}>{s.label}</span>
}

export function SeverityMeter({ value }) {
  const color = value >= 8 ? '#e11d48' : value >= 6 ? '#f97316' : value >= 4 ? '#f59e0b' : '#0ea5e9'
  return (
    <div className="flex items-center gap-1" aria-label={`Severity ${value} out of 10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          className="h-3 flex-1 rounded-full border-2 border-ink/80"
          initial={{ scaleY: 0.2, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 18 }}
          style={{ background: i < value ? color : '#f1f5f9' }}
        />
      ))}
    </div>
  )
}

// Fades in once decoded so photos never pop in half-drawn. The first posts load eagerly.
export function Photo({ src, alt, className = '', eager = false }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={eager ? 'high' : 'auto'}
      draggable={false}
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[3px] border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner size={28} className="text-leaf-500" />
    </div>
  )
}

export function Modal({ open, onClose, children, wide = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`card relative max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-b-3xl sm:p-6 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {onClose && (
              <button onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5" aria-label="Close">
                <X size={20} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const COLORS = {
  leaf: '#10b981',
  sky: '#0ea5e9',
  sun: '#f59e0b',
  coral: '#f43f5e',
  grape: '#8b5cf6',
  orange: '#f97316',
  ink: '#17324d',
}

const BOX = {
  xs: { box: 'h-7 w-7 rounded-lg', icon: 14 },
  sm: { box: 'h-9 w-9 rounded-xl', icon: 18 },
  md: { box: 'h-11 w-11 rounded-xl', icon: 22 },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 28 },
  xl: { box: 'h-20 w-20 rounded-3xl', icon: 40 },
}

// Same look as the "How it works" icons: bold outline, solid colour, white glyph.
export function IconBox({ icon: Icon, color = 'leaf', size = 'md', round = false, className = '' }) {
  const s = BOX[size]
  return (
    <span
      className={`grid shrink-0 place-items-center border-2 border-ink text-white ${s.box} ${round ? '!rounded-full' : ''} ${className}`}
      style={{ background: COLORS[color] || color }}
    >
      <Icon size={s.icon} strokeWidth={2.5} />
    </span>
  )
}

export function EmptyState({ icon = Leaf, color = 'leaf', title, text, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-soft flex flex-col items-center gap-2 px-6 py-10 text-center">
      <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}>
        <IconBox icon={icon} color={color} size="lg" />
      </motion.div>
      <h3 className="text-xl font-bold">{title}</h3>
      {text && <p className="max-w-sm text-ink/60">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

export function StatTile({ icon, label, value, color = 'leaf', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
      className="card-soft flex items-center gap-3 p-3"
    >
      <IconBox icon={icon} color={color} />
      <div className="min-w-0">
        <div className="font-display text-2xl font-extrabold leading-none">{value}</div>
        <div className="truncate text-xs font-bold text-ink/55">{label}</div>
      </div>
    </motion.div>
  )
}

export const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export const listItem = (i) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.05, type: 'spring', stiffness: 260, damping: 24 } },
})
