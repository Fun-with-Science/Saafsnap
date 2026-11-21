import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, ImagePlus } from 'lucide-react'

export default function PhotoPicker({ onPick, title = 'Snap the spot', hint = 'Get the whole mess in the frame. Clear, daylight photos work best.' }) {
  const camRef = useRef(null)
  const galRef = useRef(null)
  const handle = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) onPick(f)
  }
  return (
    <div className="card overflow-hidden">
      <motion.button
        type="button"
        onClick={() => camRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 border-b-2 border-dashed border-ink/20 bg-gradient-to-br from-leaf-50 to-sky2-100 p-6"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="grid h-24 w-24 place-items-center rounded-full border-2 border-ink bg-leaf-500 text-white shadow-pop"
        >
          <Camera size={44} strokeWidth={2.4} />
        </motion.div>
        <div className="font-display text-2xl font-extrabold">{title}</div>
        <div className="max-w-xs text-center text-sm font-semibold text-ink/55">{hint}</div>
      </motion.button>
      <div className="grid grid-cols-2 gap-3 p-4">
        <button type="button" className="btn btn-primary" onClick={() => camRef.current?.click()}>
          <Camera size={20} /> Camera
        </button>
        <button type="button" className="btn btn-white" onClick={() => galRef.current?.click()}>
          <ImagePlus size={20} /> Gallery
        </button>
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  )
}
