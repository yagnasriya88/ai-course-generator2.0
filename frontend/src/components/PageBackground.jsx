import { motion, useReducedMotion } from 'framer-motion'

const TONES = {
  primary: { a: 'bg-primary-200/40', b: 'bg-accent-400/20', c: 'bg-primary-300/25' },
  accent: { a: 'bg-accent-400/20', b: 'bg-primary-200/30', c: 'bg-accent-500/15' },
  calm: { a: 'bg-primary-100/40', b: 'bg-primary-200/20', c: 'bg-accent-400/10' },
}

function Blob({ color, className, drift, duration, reduceMotion }) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute -z-10 rounded-full blur-3xl ${color} ${className}`}
      animate={reduceMotion ? undefined : { x: [0, drift.x, 0], y: [0, drift.y, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function PageBackground({ tone = 'primary', className = '', children }) {
  const reduceMotion = useReducedMotion()
  const { a, b, c } = TONES[tone]

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.primary.100),transparent_70%)]"
      />
      <Blob
        color={a}
        className="top-24 -left-24 h-72 w-72"
        drift={{ x: 30, y: 20 }}
        duration={22}
        reduceMotion={reduceMotion}
      />
      <Blob
        color={b}
        className="top-40 -right-24 h-72 w-72"
        drift={{ x: -25, y: 30 }}
        duration={26}
        reduceMotion={reduceMotion}
      />
      <Blob
        color={c}
        className="top-96 left-1/3 h-56 w-56"
        drift={{ x: 20, y: -25 }}
        duration={19}
        reduceMotion={reduceMotion}
      />
      {children}
    </div>
  )
}

export default PageBackground
