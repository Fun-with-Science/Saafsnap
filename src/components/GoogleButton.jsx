import { useState } from 'react'
import { useStore } from '../lib/store'
import { Spinner } from './ui'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

// Only shown when Supabase is configured; Google sign-in needs its auth server.
export default function GoogleButton({ label = 'Continue with Google' }) {
  const { loginWithGoogle, dataMode } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (dataMode !== 'supabase') return null

  const go = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={go} disabled={busy} className="btn btn-white w-full">
        {busy ? <Spinner /> : <GoogleLogo />} {label}
      </button>
      {error && <div className="mt-2 rounded-2xl bg-coral-100 px-4 py-2 text-sm font-bold text-coral-600">{error}</div>}
      <div className="my-5 flex items-center gap-3 text-xs font-extrabold uppercase tracking-wider text-ink/40">
        <span className="h-0.5 flex-1 rounded bg-ink/10" /> or <span className="h-0.5 flex-1 rounded bg-ink/10" />
      </div>
    </div>
  )
}
