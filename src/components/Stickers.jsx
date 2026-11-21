import { motion } from 'framer-motion'
import { Waves, Recycle, Sparkles, Droplets, Users, Leaf, Trees, Heart, ShieldCheck, Landmark } from 'lucide-react'

const ICONS = { waves: Waves, recycle: Recycle, sparkles: Sparkles, droplets: Droplets, users: Users, leaf: Leaf, trees: Trees, heart: Heart }
export const ORG_ICON_KEYS = Object.keys(ICONS)
export const ORG_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#14b8a6', '#f43f5e', '#10b981', '#ec4899', '#6366f1']

// Calm sticker = govt lagging behind (with "zzz"); pointing sticker = govt taking action.
// Small sizes use a round badge (whole head inside the circle); `fill` makes it fill its parent.
export function GovtMascot({ mood = 'sleepy', size = 80, fill = false }) {
  const sleepy = mood === 'sleepy'
  const badge = fill || size < 84
  const src = `/stickers/govt-${sleepy ? 'calm' : 'pointing'}${badge ? '-badge' : ''}.webp`
  const z = fill ? 56 : size
  return (
    <div className={`relative shrink-0 ${fill ? 'h-full w-full' : ''}`} style={fill ? undefined : { width: size, height: size }}>
      <motion.div
        className="h-full w-full"
        style={{ originY: badge ? 0.5 : 0.9 }}
        animate={sleepy ? { rotate: [-4, 4, -4] } : { y: [0, -4, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: sleepy ? 3.2 : 1.3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src={src} alt="Government" draggable={false} className="h-full w-full select-none object-contain" />
      </motion.div>
      {sleepy &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute font-display font-extrabold text-sky2-600"
            style={{ right: -z * 0.08, top: z * 0.05, fontSize: z * (0.16 + i * 0.05) }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], x: [0, z * 0.12], y: [0, -z * 0.35] }}
            transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity }}
          >
            z
          </motion.span>
        ))}
    </div>
  )
}

export function OrgLogo({ org, size = 48, animate = false, src }) {
  const Icon = ICONS[org?.icon] || Leaf
  const color = org?.color || '#10b981'
  return (
    <motion.div
      className="grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-white"
      style={{ width: size, height: size, background: src ? '#fff' : color, boxShadow: '0 3px 0 #17324d' }}
      animate={animate ? { rotate: [0, -8, 8, 0], scale: [1, 1.06, 1] } : undefined}
      transition={animate ? { duration: 2.2, repeat: Infinity, repeatDelay: 1 } : undefined}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <Icon color="#fff" strokeWidth={2.6} size={size * 0.5} />
      )}
    </motion.div>
  )
}

const SKINS = ['#f6c7a1', '#e0a87a', '#c68654', '#8d5a3b', '#f2d0b1']

export function CitizenHero({ size = 80, seed = 3, animate = true }) {
  const skin = SKINS[seed % SKINS.length]
  return (
    <motion.svg viewBox="0 0 120 120" width={size} height={size}
      animate={animate ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
      <path d="M22 112 Q60 70 98 112 Z" fill="#10b981" stroke="#17324d" strokeWidth="3" />
      <circle cx="60" cy="58" r="32" fill={skin} stroke="#17324d" strokeWidth="3" />
      <path d="M28 52 Q60 16 92 52 Q86 34 60 28 Q34 34 28 52 Z" fill="#1f2937" stroke="#17324d" strokeWidth="3" />
      <rect x="27" y="44" width="66" height="9" rx="4.5" fill="#f43f5e" stroke="#17324d" strokeWidth="2.5" />
      <path d="M92 44 q12 -10 16 2 q-10 6 -16 -2 z" fill="#22c55e" stroke="#17324d" strokeWidth="2.5" />
      <circle cx="48" cy="62" r="4.5" fill="#17324d" />
      <circle cx="72" cy="62" r="4.5" fill="#17324d" />
      <path d="M48 74 Q60 86 72 74" stroke="#17324d" strokeWidth="3.5" fill="#fff" strokeLinecap="round" />
      <circle cx="40" cy="72" r="5" fill="#fda4af" opacity=".7" />
      <circle cx="80" cy="72" r="5" fill="#fda4af" opacity=".7" />
    </motion.svg>
  )
}

function initials(name = '?') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()
}

const AVATAR_TONES = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6']

export function UserAvatar({ user, size = 40 }) {
  if (!user) return <div className="rounded-full bg-ink/10" style={{ width: size, height: size }} />
  if (user.avatar && user.role !== 'citizen' && user.role !== 'admin') return <OrgLogo org={user.org} src={user.avatar} size={size} />
  if (user.role === 'ngo' || user.role === 'group') return <OrgLogo org={user.org} size={size} />
  if (user.role === 'govt')
    return (
      <div className="grid shrink-0 place-items-center rounded-full border-2 border-ink bg-sky2-100" style={{ width: size, height: size }}>
        <Landmark size={size * 0.5} className="text-sky2-600" strokeWidth={2.5} />
      </div>
    )
  if (user.role === 'admin')
    return (
      <div className="grid shrink-0 place-items-center rounded-full border-2 border-ink bg-ink" style={{ width: size, height: size }}>
        <ShieldCheck size={size * 0.5} className="text-leaf-400" strokeWidth={2.5} />
      </div>
    )
  const tone = AVATAR_TONES[(user.name?.charCodeAt(0) || 0) % AVATAR_TONES.length]
  return (
    <div className="grid shrink-0 place-items-center rounded-full border-2 border-ink font-display font-extrabold text-white"
      style={{ width: size, height: size, background: tone, fontSize: size * 0.38 }}>
      {initials(user.name)}
    </div>
  )
}
