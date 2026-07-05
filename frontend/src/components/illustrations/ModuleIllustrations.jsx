// Small, topic-agnostic icon-in-halo scenes used to give each module some visual
// variety without attempting per-topic generated art — picked deterministically
// per module via moduleIllustration.js, mirroring coverGradient.js's pattern.

function Halo({ color, children }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="46" fill={color} />
      {children}
    </svg>
  )
}

export function BookIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#dbeafe">
        <path d="M50 32c-8-6-20-6-26 0v34c6-6 18-6 26 0z" fill="#2563eb" />
        <path d="M50 32c8-6 20-6 26 0v34c-6-6-18-6-26 0z" fill="#60a5fa" />
        <line x1="50" y1="32" x2="50" y2="66" stroke="#1e3a8a" strokeWidth="1.5" />
      </Halo>
    </div>
  )
}

export function LightbulbIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#fef3c7">
        <circle cx="50" cy="42" r="16" fill="#fbbf24" />
        <rect x="43" y="56" width="14" height="10" rx="2" fill="#d97706" />
        <line x1="50" y1="20" x2="50" y2="14" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="30" x2="27" y2="26" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
        <line x1="68" y1="30" x2="73" y2="26" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      </Halo>
    </div>
  )
}

export function CodeIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#dcfce7">
        <rect x="26" y="30" width="48" height="34" rx="6" fill="#16a34a" />
        <path d="M38 42l-6 6 6 6" stroke="#dcfce7" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 42l6 6-6 6" stroke="#dcfce7" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="46" y1="53" x2="54" y2="41" stroke="#dcfce7" strokeWidth="3" strokeLinecap="round" />
      </Halo>
    </div>
  )
}

export function BeakerIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#fde7ee">
        <path d="M42 26h16v14l12 22a6 6 0 0 1-5 9H35a6 6 0 0 1-5-9l12-22z" fill="#ec4899" />
        <rect x="40" y="24" width="20" height="5" rx="2" fill="#be185d" />
        <path d="M37 56h26" stroke="#fde7ee" strokeWidth="3" />
        <circle cx="47" cy="62" r="2.5" fill="#fde7ee" />
        <circle cx="55" cy="65" r="2" fill="#fde7ee" />
      </Halo>
    </div>
  )
}

export function PuzzleIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#ede9fe">
        <path
          d="M38 32h12a4 4 0 0 1 8 0h12v12a4 4 0 0 1 0 8v12H58a4 4 0 0 1-8 0H38V52a4 4 0 0 0 0-8z"
          fill="#7c3aed"
        />
      </Halo>
    </div>
  )
}

export function ChartIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#e0f2fe">
        <rect x="32" y="50" width="9" height="16" rx="2" fill="#0284c7" />
        <rect x="46" y="40" width="9" height="26" rx="2" fill="#38bdf8" />
        <rect x="60" y="32" width="9" height="34" rx="2" fill="#0284c7" />
      </Halo>
    </div>
  )
}

export const MODULE_ILLUSTRATIONS = [
  BookIllustration,
  LightbulbIllustration,
  CodeIllustration,
  BeakerIllustration,
  PuzzleIllustration,
  ChartIllustration,
]
