import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getDiagramJob } from '../utils/api'
import { useAuth } from './AuthContext'

const DiagramJobsContext = createContext(null)
const ACTIVE_JOB_KEY = 'ttl_active_diagram_job_id'
const POLL_INTERVAL_MS = 3000

/** Tracks the single most-recently-submitted diagram generation job, mirroring
 * JobsContext.jsx's course-generation tracker exactly but keyed on its own
 * localStorage id so course and diagram generation never clobber each other's
 * in-flight job. */
export function DiagramJobsProvider({ children }) {
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
        const job = await getDiagramJob(activeJob._id)
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
    <DiagramJobsContext.Provider
      value={{ activeJob, startTracking, stopTracking, notice, clearNotice: () => setNotice(null) }}
    >
      {children}
    </DiagramJobsContext.Provider>
  )
}

export function useDiagramJobs() {
  const ctx = useContext(DiagramJobsContext)
  if (!ctx) throw new Error('useDiagramJobs must be used within a DiagramJobsProvider')
  return ctx
}
