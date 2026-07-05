import { motion } from 'framer-motion'

function StudyingIllustration({ className = 'h-48 w-48' }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="100" cy="104" r="82" fill="#fde7ee" />
      <circle cx="150" cy="52" r="8" fill="#fbbf24" opacity="0.9" />
      <circle cx="42" cy="140" r="5" fill="#60a5fa" opacity="0.8" />
      <circle cx="158" cy="132" r="4" fill="#fbbf24" opacity="0.7" />

      {/* desk */}
      <rect x="42" y="146" width="116" height="8" rx="3" fill="#1e3a8a" opacity="0.15" />
      <rect x="52" y="154" width="6" height="26" fill="#1e3a8a" opacity="0.15" />
      <rect x="142" y="154" width="6" height="26" fill="#1e3a8a" opacity="0.15" />

      {/* laptop */}
      <rect x="76" y="120" width="48" height="30" rx="4" fill="#2563eb" />
      <rect x="80" y="124" width="40" height="21" rx="2" fill="#93c5fd" />
      <rect x="70" y="150" width="60" height="6" rx="2" fill="#1d4ed8" />

      {/* person */}
      <path d="M64 146c0-24 16-40 36-40s36 16 36 40" fill="#2563eb" />
      <circle cx="100" cy="82" r="22" fill="#f6c298" />
      <path
        d="M78 76c0-16 10-26 22-26s22 10 22 26c-6-6-14-9-22-9s-16 3-22 9z"
        fill="#3b2a20"
      />
      <circle cx="92" cy="83" r="2.4" fill="#3b2a20" />
      <circle cx="108" cy="83" r="2.4" fill="#3b2a20" />
      <path d="M93 91q7 4 14 0" stroke="#3b2a20" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* mug */}
      <rect x="134" y="132" width="14" height="14" rx="2" fill="#fbbf24" />
      <path d="M148 135h4a3 3 0 0 1 0 6h-4" stroke="#fbbf24" strokeWidth="2" fill="none" />
    </motion.svg>
  )
}

export default StudyingIllustration
