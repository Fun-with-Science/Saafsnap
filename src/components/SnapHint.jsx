import { useCallback, useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

const KEY = 'saafsnap.snapHint'

// Points new visitors at the main feature (the Gemini photo analyser) once per app visit.
export function useSnapHint(pathname) {
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) !== '1'
    } catch {
      return true
    }
  })
  const hide = useCallback(() => {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* storage blocked: hint may show again on reload */
    }
    setShow(false)
  }, [])
  useEffect(() => {
    if (pathname === '/snap') hide()
  }, [pathname, hide])
  return [show && pathname !== '/snap', hide]
}

// Expanding rings drawn behind the highlighted button. Pure CSS (transform + opacity only),
// so phones animate them on the GPU without re-laying out the page.
export function PulseRings({ round = true }) {
  return (
    <>
      {[0, 0.8].map((d) => (
        <span
          key={d}
          aria-hidden="true"
          className={`snap-ring pointer-events-none absolute inset-0 border-4 border-leaf-400 ${round ? 'rounded-full' : 'snap-ring-soft rounded-2xl'}`}
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </>
  )
}

// Speech bubble. side="top" sits above the button (phone), side="right" beside it (desktop).
export function HintBubble({ onClose, side = 'top' }) {
  const top = side === 'top'
  const close = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }
  return (
    <div className={`pointer-events-none absolute z-50 ${top ? 'bottom-full left-1/2 mb-3 -translate-x-1/2' : 'left-full top-1/2 ml-4 -translate-y-1/2'}`}>
      <div className={`snap-pop ${top ? 'snap-bob-y' : 'snap-bob-x'}`}>
        <div
          className="pointer-events-auto relative flex items-center gap-1.5 whitespace-nowrap rounded-2xl border-2 border-ink bg-ink py-2 pl-3 pr-1.5 font-display text-[15px] font-bold text-white shadow-pop"
          role="status"
        >
          <Sparkles size={17} className="shrink-0 text-sun-400" strokeWidth={2.6} />
          Try Gemini AI analyzer
          <span
            role="button"
            tabIndex={0}
            onClick={close}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && close(e)}
            aria-label="Dismiss tip"
            className="ml-0.5 grid h-7 w-7 place-items-center rounded-full text-white/60 hover:bg-white/15 hover:text-white"
          >
            <X size={14} strokeWidth={3} />
          </span>
          <span
            aria-hidden="true"
            className={`absolute h-3 w-3 rotate-45 border-ink bg-ink ${top ? '-bottom-[7px] left-1/2 -ml-1.5 border-b-2 border-r-2' : '-left-[7px] top-1/2 -mt-1.5 border-b-2 border-l-2'}`}
          />
        </div>
      </div>
    </div>
  )
}
