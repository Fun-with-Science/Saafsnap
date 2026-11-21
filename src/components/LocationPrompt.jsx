import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Lock } from 'lucide-react'
import { useStore } from '../lib/store'
import { Modal, IconBox, Spinner } from './ui'

const ASKED_KEY = 'saafsnap.locationAsked'

function alreadyAsked() {
  try {
    return sessionStorage.getItem(ASKED_KEY) === '1'
  } catch {
    return false
  }
}
function markAsked() {
  try {
    sessionStorage.setItem(ASKED_KEY, '1')
  } catch {
    /* storage blocked: prompt may show again on reload */
  }
}

// Shown once per login session, so the browser's own permission prompt appears with context.
export default function LocationPrompt() {
  const { me, locPerm, refreshLocation } = useStore()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (me && (locPerm === 'prompt' || locPerm === 'denied') && !alreadyAsked()) setOpen(true)
  }, [me, locPerm])

  const close = () => {
    markAsked()
    setOpen(false)
  }

  const allow = async () => {
    setBusy(true)
    await refreshLocation()
    setBusy(false)
    close()
  }

  const blocked = locPerm === 'denied'

  return (
    <Modal open={open} onClose={close}>
      <div className="text-center">
        <motion.div className="flex justify-center" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <IconBox icon={blocked ? Lock : MapPin} color={blocked ? 'sun' : 'coral'} size="xl" />
        </motion.div>
        <h2 className="mt-4 text-2xl font-extrabold">{blocked ? 'Location is blocked' : 'Turn on location'}</h2>
        {blocked ? (
          <p className="mt-2 font-semibold text-ink/60">
            Your browser is blocking location for SaafSnap. Tap the lock icon next to the website address, allow <b>Location</b>, then reload. You can still drop a pin on the map by hand.
          </p>
        ) : (
          <p className="mt-2 font-semibold text-ink/60">
            Every snap gets pinned to the exact spot, so the AI knows the area and the complaint reaches the right ward officer. We only use it when you report or clean a spot.
          </p>
        )}
        <div className="mt-6 grid gap-2">
          {!blocked && (
            <button className="btn btn-primary w-full" onClick={allow} disabled={busy}>
              {busy ? <Spinner /> : <MapPin size={20} />} Allow location
            </button>
          )}
          <button className={`btn w-full ${blocked ? 'btn-primary' : 'btn-white'}`} onClick={close}>
            {blocked ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
