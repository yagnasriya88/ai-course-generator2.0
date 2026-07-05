import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { listGenerationJobs } from '../utils/api'
import useFetch from '../hooks/useFetch'
import ErrorMessage from '../components/ErrorMessage'
import Skeleton from '../components/Skeleton'
import PageBackground from '../components/PageBackground'
import { fadeInUp, staggerContainer } from '../utils/motion'

const STATUS_META = {
  queued: { label: 'Queued', icon: Clock, className: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Processing', icon: Loader2, className: 'bg-primary-50 text-primary-700', spin: true },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-danger-500/10 text-danger-600' },
}

function JobRow({ job }) {
  const meta = STATUS_META[job.status]
  const Icon = meta.icon

  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-glow backdrop-blur-md"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{job.request.topic}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {new Date(job.created_at).toLocaleString()}
          {job.status === 'failed' && job.error ? ` — ${job.error}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
          <Icon className={`h-3.5 w-3.5 ${meta.spin ? 'animate-spin' : ''}`} />
          {meta.label}
        </span>
        {job.status === 'completed' && job.course_id && (
          <Link
            to={`/course/${job.course_id}`}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-500"
          >
            View course
          </Link>
        )}
      </div>
    </motion.div>
  )
}

function GenerationJobs() {
  const { data: jobs, status, error, reload } = useFetch(listGenerationJobs, [])

  useEffect(() => {
    const hasActive = jobs?.some((j) => j.status === 'queued' || j.status === 'processing')
    if (!hasActive) return
    const interval = setInterval(reload, 4000)
    return () => clearInterval(interval)
  }, [jobs, reload])

  return (
    <PageBackground tone="calm" className="min-h-full">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-slate-900">Course generation jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every course you've asked Learnify AI to build, and its current status.
        </p>

        {status === 'loading' && (
          <div className="mt-8 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <ErrorMessage message={error} onRetry={reload} />
          </div>
        )}

        {status === 'success' && jobs.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            No courses generated yet — head to New Course to get started.
          </div>
        )}

        {status === 'success' && jobs.length > 0 && (
          <motion.div
            className="mt-8 flex flex-col gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {jobs.map((job) => (
              <JobRow key={job._id} job={job} />
            ))}
          </motion.div>
        )}
      </div>
    </PageBackground>
  )
}

export default GenerationJobs
