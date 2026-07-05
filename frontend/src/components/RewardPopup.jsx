import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Lottie from './LottiePlayer'
import { Coins, PartyPopper, Star, X } from 'lucide-react'
import confettiAnimation from '../assets/lottie/confetti-burst.json'
import { celebrationSpring } from '../utils/motion'

const PARTICLE_COUNT = 14

function useParticles(seed) {
  return useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4
        const distance = 90 + Math.random() * 60
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: Math.random() * 360,
          delay: Math.random() * 0.15,
          isCoin: i % 2 === 0,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed]
  )
}

function RewardPopup({ reward, onClose, variant = 'lesson' }) {
  const particles = useParticles(reward)
  const isCourse = variant === 'course'

  useEffect(() => {
    if (!reward) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const timer = setTimeout(onClose, isCourse ? 8000 : 5000)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward, onClose])

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={celebrationSpring}
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {isCourse ? (
              <Lottie animationData={confettiAnimation} loop={false} className="h-40 w-40" />
            ) : (
              <div className="relative flex h-20 w-20 items-center justify-center">
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    className="absolute"
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 1 }}
                    transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
                  >
                    {p.isCoin ? (
                      <Coins className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                    )}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow"
                >
                  <PartyPopper className="h-8 w-8" />
                </motion.span>
              </div>
            )}

            <div>
              <p className="font-display text-lg font-bold text-slate-900">
                {isCourse
                  ? 'Course complete! 🎉'
                  : reward?.leveledUp
                    ? `Level up! You're now level ${reward.level}`
                    : 'Lesson complete!'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {isCourse
                  ? `You've finished "${reward?.courseTitle ?? 'this course'}" — incredible work!`
                  : reward?.leveledUp
                    ? 'Great momentum — keep the streak going.'
                    : "Nice work — you're one step closer to mastering this course."}
              </p>
            </div>

            {!isCourse && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-accent-400/15 px-3 py-1.5 text-sm font-semibold text-accent-600">
                  <Star className="h-4 w-4 fill-accent-400 text-accent-500" />
                  +{reward?.xpAwarded ?? 0} XP
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                  <Coins className="h-4 w-4 text-amber-500" />
                  +{reward?.goldAwarded ?? 0} gold
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
            >
              Keep learning
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RewardPopup
