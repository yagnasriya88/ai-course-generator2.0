import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getGenerationJob } from '../utils/api'
import { useAuth } from './AuthContext'

const JobsContext = createContext(null)
const ACTIVE_JOB_KEY = 'ttl_active_job_id'
const POLL_INTERVAL_MS = 3000

/** Tracks the single most-recently-submitted course generation job so its
 * progress survives page navigation, refresh, and closing/reopening the tab —
 * the job id lives in localStorage, and this provider resumes polling it on
 * mount instead of the request simply being forgotten client-side. Mounted
 * once at the app shell so both the inline CreateCourse progress UI and the
 * global completion toast share one poll instead of each running their own. */
export function JobsProvider({ children }) {
  const { user } = useAuth()
  const [activeJob, setActiveJob] = useState(null)
  const [notice, setNotice] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const storedId = localStorage.getItem(ACTIVE_JOB_KEY)
    if (storedId) setActiveJob({ _id: storedId, status: 'queued' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!activeJob?._id || activeJob.status === 'completed' || activeJob.status === 'failed') return

    let cancelled = false
    async function poll() {
      try {
        const job = await getGenerationJob(activeJob._id)
        if (cancelled) return
        setActiveJob(job)
        if (job.status === 'completed' || job.status === 'failed') {
          setNotice(job)
          localStorage.removeItem(ACTIVE_JOB_KEY)
        } else {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (cancelled) return
        // A 404 means the job genuinely no longer exists for this user — anything
        // else (network blip, a fetch aborted by an in-flight page navigation/
        // refresh) is transient, so keep retrying instead of abandoning tracking;
        // losing track of an in-progress job here would defeat the whole point of
        // surviving navigation/refresh.
        if (err.message === 'Job not found') {
          localStorage.removeItem(ACTIVE_JOB_KEY)
          setActiveJob(null)
        } else {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      }
    }
    poll()
    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?._id, activeJob?.status])

  function startTracking(job) {
    localStorage.setItem(ACTIVE_JOB_KEY, job._id)
    setActiveJob(job)
  }

  function stopTracking() {
    localStorage.removeItem(ACTIVE_JOB_KEY)
    setActiveJob(null)
  }

  return (
    <JobsContext.Provider
      value={{ activeJob, startTracking, stopTracking, notice, clearNotice: () => setNotice(null) }}
    >
      {children}
    </JobsContext.Provider>
  )
}

export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs must be used within a JobsProvider')
  return ctx
}
