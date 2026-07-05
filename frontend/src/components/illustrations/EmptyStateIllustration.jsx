import { motion } from 'framer-motion'

function EmptyStateIllustration({ className = 'h-40 w-40' }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="100" cy="106" r="80" fill="#dbeafe" />
      <circle cx="44" cy="60" r="5" fill="#fbbf24" />
      <circle cx="158" cy="72" r="4" fill="#f472b6" opacity="0.8" />
      <circle cx="152" cy="140" r="3.5" fill="#60a5fa" opacity="0.8" />

      {/* legs */}
      <rect x="86" y="150" width="10" height="26" rx="4" fill="#1d4ed8" />
      <rect x="104" y="150" width="10" height="26" rx="4" fill="#1d4ed8" />

      {/* body */}
      <path d="M74 108c0-18 12-30 26-30s26 12 26 30v42a6 6 0 0 1-6 6H80a6 6 0 0 1-6-6z" fill="#2563eb" />
      <rect x="90" y="118" width="20" height="8" rx="4" fill="#fbbf24" />

      {/* waving arm */}
      <path d="M124 100c8-4 16-2 20 6s0 16-8 18" stroke="#2563eb" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="136" cy="86" r="7" fill="#f6c298" />
      {/* resting arm */}
      <path d="M78 112c-6 4-8 12-6 20" stroke="#2563eb" strokeWidth="10" strokeLinecap="round" fill="none" />

      {/* head */}
      <circle cx="100" cy="74" r="20" fill="#f6c298" />
      <path d="M80 70c0-14 9-22 20-22s20 8 20 22c-5-5-13-8-20-8s-15 3-20 8z" fill="#3b2a20" />
      <circle cx="93" cy="75" r="2.2" fill="#3b2a20" />
      <circle cx="107" cy="75" r="2.2" fill="#3b2a20" />
      <path d="M93 83q7 5 14 0" stroke="#3b2a20" strokeWidth="2" strokeLinecap="round" fill="none" />
    </motion.svg>
  )
}

export default EmptyStateIllustration
