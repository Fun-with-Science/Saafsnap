import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { Spinner } from './ui'

export default function AiScanner({ image, steps, title = 'Gemini is looking…' }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 550)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink bg-ink">
        <img src={image} alt="" className="h-full w-full object-cover opacity-80" />
        <div className="scanline" />
        {[0, 1, 2, 3].map((k) => (
          <motion.span
            key={k}
            className="absolute rounded-lg border-[3px] border-leaf-400"
            style={{ left: `${15 + k * 18}%`, top: `${25 + (k % 2) * 30}%`, width: '18%', height: '22%' }}
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [1.4, 1, 1, 0.9] }}
            transition={{ duration: 1.8, delay: 0.4 + k * 0.45, repeat: Infinity, repeatDelay: 1 }}
          />
        ))}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-extrabold shadow-popsm">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}>
            <Sparkles size={16} className="text-grape-500" />
          </motion.span>
          {title}
        </div>
      </div>
      <ul className="space-y-2 p-5">
        {steps.map((s, k) => (
          <motion.li key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: k <= i ? 1 : 0.35, x: 0 }} transition={{ delay: k * 0.05 }} className="flex items-center gap-3 font-bold">
            <span className={`grid h-7 w-7 place-items-center rounded-full border-2 ${k < i ? 'border-leaf-600 bg-leaf-500 text-white' : 'border-ink/20 text-ink/40'}`}>
              {k < i ? <Check size={15} strokeWidth={3} /> : k === i ? <Spinner size={14} className="text-leaf-500" /> : k + 1}
            </span>
            {s}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
