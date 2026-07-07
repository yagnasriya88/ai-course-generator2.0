import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { generateCourse } from '../utils/api'
import { useJobs } from '../context/JobsContext'
import ErrorMessage from './ErrorMessage'

const AGENT_STEPS = [
  'Course Planner Agent is designing your roadmap…',
  'Module Generator Agents are writing lessons concurrently…',
  'Assembling your course…',
]

const EXAMPLE_TOPICS = [
  'Prompt Engineering',
  'Introduction to Python',
  'React Hooks in depth',
  'Public speaking basics',
  'Personal finance 101',
  'SQL for data analysis',
]

function PromptForm({ onGenerated }) {
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('')
  const [goals, setGoals] = useState('')
  const [studyTime, setStudyTime] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const { activeJob, startTracking, stopTracking } = useJobs()
  const navigate = useNavigate()

  const status =
    submitting || activeJob?.status === 'queued' || activeJob?.status === 'processing'
      ? 'loading'
      : 'idle'

  useEffect(() => {
    if (status !== 'loading') return
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, AGENT_STEPS.length - 1))
    }, 3500)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (activeJob?.status === 'completed') {
      const courseId = activeJob.course_id
      stopTracking()
      onGenerated({ _id: courseId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.status])

  async function submitJob() {
    setSubmitError(null)
    setStepIndex(0)
    try {
      const job = await generateCourse({
        topic,
        level: level || null,
        goals: goals || null,
        study_time: studyTime || null,
      })
      startTracking(job)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!topic.trim() || status === 'loading') return
    setSubmitting(true)
    submitJob()
  }

  function handleRetry() {
    stopTracking()
    setSubmitting(true)
    submitJob()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Intro to React Hooks"
          disabled={status === 'loading'}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !topic.trim()}
          className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate Course
        </button>
      </div>

      {status === 'idle' && !topic && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Try:
          </span>
          {EXAMPLE_TOPICS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setTopic(example)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 text-xs font-medium text-slate-400 underline-offset-2 hover:text-primary-600 hover:underline"
      >
        {showAdvanced ? 'Hide options' : 'Level, goals, and study time (optional)'}
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary-400"
              >
                <option value="">Any level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                type="text"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Your goal (optional)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary-400"
              />
              <input
                type="text"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
                placeholder="Study time (optional)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'loading' && (
        <div className="mt-8 flex flex-col items-center gap-3 text-slate-500">
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
          <AnimatePresence mode="wait">
            <motion.p
              key={activeJob?.status === 'queued' ? 'queued' : stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm"
            >
              {activeJob?.status === 'queued'
                ? 'Queued — your course will start generating shortly…'
                : AGENT_STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
          <p className="text-xs text-slate-400">
            Feel free to navigate away — we&apos;ll keep working and let you know when it&apos;s ready.
          </p>
        </div>
      )}

      {submitError && (
        <div className="mt-6">
          <ErrorMessage message={submitError} onRetry={handleSubmit} />
        </div>
      )}

      {activeJob?.status === 'failed' && (
        <div className="mt-6">
          <ErrorMessage
            message={activeJob.error || 'Course generation failed.'}
            onRetry={handleRetry}
          />
        </div>
      )}
    </form>
  )
}

export default PromptForm
