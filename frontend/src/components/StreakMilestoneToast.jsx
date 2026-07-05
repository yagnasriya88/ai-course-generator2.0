import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Lottie from './LottiePlayer'
import { useStreakMilestone } from '../hooks/useStreakMilestone'
import { celebrationSpring } from '../utils/motion'
import streakFlameAnimation from '../assets/lottie/streak-flame.json'

function StreakMilestoneToast() {
  const { milestone, clearMilestone } = useStreakMilestone()

  useEffect(() => {
    if (!milestone) return
    const timer = setTimeout(clearMilestone, 5000)
    return () => clearTimeout(timer)
  }, [milestone, clearMilestone])

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={celebrationSpring}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-orange-200 bg-white px-5 py-3 shadow-2xl"
        >
          <Lottie animationData={streakFlameAnimation} loop className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{milestone}-day streak!</p>
            <p className="text-xs text-slate-500">You&apos;re on fire — keep it up.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default StreakMilestoneToast
