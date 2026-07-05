import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'ttl_last_seen_streak'
const MILESTONES = [3, 7, 14, 30, 60, 100]

/** `bump_streak` runs server-side on every /auth/me|login|signup and is idempotent
 * per UTC day, so the streak has often already ticked over by the time the client
 * sees `user` for the first time — there's no "old" in-memory value to diff against.
 * Persisting the last-seen value in localStorage gives a real baseline to compare
 * against across page loads/sessions, not just within one. */
export function useStreakMilestone() {
  const { user } = useAuth()
  const [milestone, setMilestone] = useState(null)

  useEffect(() => {
    if (!user) return
    const current = user.current_streak ?? 0
    const stored = localStorage.getItem(STORAGE_KEY)
    // No stored baseline yet (first-ever load) — default previous to current so an
    // existing streak from before this feature shipped doesn't falsely "cross" a
    // milestone the moment someone upgrades.
    const previous = stored !== null ? Number(stored) : current
    const crossed = MILESTONES.find((m) => previous < m && current >= m)
    if (crossed) setMilestone(crossed)
    localStorage.setItem(STORAGE_KEY, String(current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.current_streak])

  return { milestone, clearMilestone: () => setMilestone(null) }
}
