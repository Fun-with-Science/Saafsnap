export default function Logo({ size = 36, withText = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <rect x="3" y="5" width="58" height="56" rx="18" fill="#17324d" />
        <rect x="2" y="2" width="58" height="56" rx="18" fill="#10b981" stroke="#17324d" strokeWidth="3" />
        <rect x="14" y="10" width="14" height="8" rx="3" fill="#fff" stroke="#17324d" strokeWidth="2.5" />
        <circle cx="31" cy="33" r="15" fill="#fff" stroke="#17324d" strokeWidth="3" />
        <circle cx="31" cy="33" r="8" fill="#17324d" />
        <circle cx="34" cy="30" r="2.5" fill="#fff" />
        <path d="M48 12 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5z" fill="#fde047" stroke="#17324d" strokeWidth="2" />
      </svg>
      {withText && (
        <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Saaf<span className="text-leaf-500">Snap</span>
        </span>
      )}
    </span>
  )
}
