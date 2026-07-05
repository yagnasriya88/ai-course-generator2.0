import { motion } from 'framer-motion'

/** Friendly round bot mascot for the AI assistant surfaces. `state` swaps between a
 * calm idle loop (gentle bob + periodic blink) and a livelier thinking loop (faster
 * bob + a pulsing antenna + orbiting "processing" dots) while a response is pending. */
function AIAssistantMascot({ state = 'idle', className = 'h-12 w-12' }) {
  const thinking = state === 'thinking'

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      animate={{ y: thinking ? [0, -4, 0] : [0, -2, 0] }}
      transition={{ duration: thinking ? 1.1 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="50" cy="52" r="44" fill="#dbeafe" />

      {/* antenna */}
      <line x1="50" y1="14" x2="50" y2="24" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <motion.circle
        cx="50"
        cy="10"
        r="5"
        fill="#fbbf24"
        animate={{ scale: thinking ? [1, 1.4, 1] : [1, 1.1, 1] }}
        transition={{ duration: thinking ? 0.6 : 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* head */}
      <rect x="24" y="26" width="52" height="46" rx="20" fill="#2563eb" />
      <rect x="32" y="34" width="36" height="26" rx="12" fill="#eff6ff" />

      {/* eyes */}
      <motion.g
        animate={{ scaleY: thinking ? 1 : [1, 1, 0.1, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
        style={{ originX: '0.5px', originY: '46px' }}
      >
        <circle cx="42" cy="46" r="4.5" fill="#2563eb" />
        <circle cx="58" cy="46" r="4.5" fill="#2563eb" />
      </motion.g>

      {/* mouth */}
      <path d="M42 54q8 5 16 0" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* body */}
      <rect x="34" y="72" width="32" height="14" rx="7" fill="#93c5fd" />

      {/* thinking dots orbiting */}
      {thinking && (
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '50px', originY: '52px' }}
        >
          <circle cx="86" cy="52" r="3" fill="#fbbf24" />
          <circle cx="14" cy="52" r="2.5" fill="#60a5fa" opacity="0.8" />
        </motion.g>
      )}
    </motion.svg>
  )
}

export default AIAssistantMascot
