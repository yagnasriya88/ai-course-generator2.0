import { motion } from 'framer-motion'

function NoSearchResultsIllustration({ className = 'h-40 w-40' }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="100" cy="106" r="80" fill="#fef3c7" />
      <circle cx="150" cy="60" r="4" fill="#2563eb" opacity="0.5" />
      <circle cx="46" cy="130" r="3.5" fill="#f472b6" opacity="0.7" />

      {/* legs */}
      <rect x="86" y="150" width="10" height="26" rx="4" fill="#b45309" />
      <rect x="104" y="150" width="10" height="26" rx="4" fill="#b45309" />

      {/* body */}
      <path d="M74 108c0-18 12-30 26-30s26 12 26 30v42a6 6 0 0 1-6 6H80a6 6 0 0 1-6-6z" fill="#f59e0b" />

      {/* arm holding magnifier */}
      <path d="M122 100c10-6 20-10 28-8" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* other arm, shrug */}
      <path d="M78 112c-6 6-6 14-2 20" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" fill="none" />

      {/* magnifying glass */}
      <circle cx="158" cy="80" r="15" fill="none" stroke="#1e3a8a" strokeWidth="6" />
      <line x1="168" y1="91" x2="180" y2="103" stroke="#1e3a8a" strokeWidth="7" strokeLinecap="round" />
      <path d="M150 84q6-8 14-4" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* head, puzzled */}
      <circle cx="100" cy="74" r="20" fill="#f6c298" />
      <path d="M80 70c0-14 9-22 20-22s20 8 20 22c-5-5-13-8-20-8s-15 3-20 8z" fill="#3b2a20" />
      <circle cx="93" cy="76" r="2.2" fill="#3b2a20" />
      <circle cx="107" cy="74" r="2.2" fill="#3b2a20" />
      <path d="M93 85q7 1 14 -1" stroke="#3b2a20" strokeWidth="2" strokeLinecap="round" fill="none" />
    </motion.svg>
  )
}

export default NoSearchResultsIllustration
