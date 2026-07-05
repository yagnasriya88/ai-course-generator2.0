import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useJobs } from '../context/JobsContext'
import { celebrationSpring } from '../utils/motion'

function JobNotificationToast() {
  const { notice, clearNotice } = useJobs()
  const navigate = useNavigate()

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(clearNotice, 6000)
    return () => clearTimeout(timer)
  }, [notice, clearNotice])

  const succeeded = notice?.status === 'completed'

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={celebrationSpring}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-md"
        >
          {succeeded ? (
            <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="h-8 w-8 shrink-0 text-danger-500" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {succeeded ? 'Your course is ready!' : 'Course generation failed'}
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {succeeded ? notice.request?.topic : notice.error || 'Please try again.'}
            </p>
          </div>
          {succeeded && (
            <button
              type="button"
              onClick={() => {
                navigate(`/course/${notice.course_id}`)
                clearNotice()
              }}
              className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-500"
            >
              View
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default JobNotificationToast
