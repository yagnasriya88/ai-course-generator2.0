import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Circle, ListChecks, Plus, Search, Sparkles, X } from 'lucide-react'
import { listCourses, listQuizzes } from '../utils/api'
import useFetch from '../hooks/useFetch'
import ErrorMessage from '../components/ErrorMessage'
import Skeleton from '../components/Skeleton'
import CourseCard from '../components/CourseCard'
import PageBackground from '../components/PageBackground'
import EmptyStateIllustration from '../components/illustrations/EmptyStateIllustration'
import NoSearchResultsIllustration from '../components/illustrations/NoSearchResultsIllustration'
import { usePageMotion } from '../utils/motion'

const LEVELS = [
  { id: '', label: 'Any level' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'alphabetical', label: 'A–Z' },
]

const TABS = [
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'my-courses', label: 'My Courses', icon: Sparkles },
  { id: 'quizzes', label: 'Quizzes', icon: ListChecks },
]

function QuizzesTab() {
  const [quizzes, setQuizzes] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const { fadeInUp, staggerContainer } = usePageMotion()

  useEffect(() => {
    listQuizzes()
      .then((data) => {
        setQuizzes(data)
        setStatus('success')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="mt-8 flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mt-8">
        <ErrorMessage message={error} />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <EmptyStateIllustration className="h-32 w-32" />
        <p className="text-slate-500">No module quizzes yet.</p>
        <p className="text-xs text-slate-400">
          Complete every lesson in a module to unlock its quiz.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="mt-8 flex flex-col gap-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {quizzes.map((quiz) => (
        <motion.div key={`${quiz.course_id}-${quiz.module_id}`} variants={fadeInUp}>
          <Link
            to={`/course/${quiz.course_id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{quiz.module_title}</p>
              <p className="truncate text-xs text-slate-400">{quiz.course_title}</p>
            </div>
            {quiz.quiz_completed ? (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success-500/10 px-2.5 py-1 text-xs font-semibold text-success-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Passed · {quiz.quiz_score}/{quiz.quiz_total}
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                <Circle className="h-3.5 w-3.5" />
                Available
              </span>
            )}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-2 h-1.5 w-full" />
      </div>
    </div>
  )
}

function CourseList() {
  const { data: courses, status, error, reload } = useFetch(() => listCourses(), [])
  const [tab, setTab] = useState('courses')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const { fadeInUp, staggerContainer } = usePageMotion()

  const isCourseTab = tab === 'courses' || tab === 'my-courses'
  const visibleCourses = courses?.filter((c) =>
    tab === 'courses' ? c.is_platform : c.is_platform === false
  )
  const searchedCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visibleCourses
      ?.filter((c) => !level || c.level === level)
      .filter((c) => !q || c.title?.toLowerCase().includes(q) || c.tags?.some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => (sortBy === 'alphabetical' ? a.title.localeCompare(b.title) : 0))
    // visibleCourses is a fresh array every render (derived from courses+tab
    // above), so depend on its actual inputs instead — otherwise this memo
    // would recompute every render anyway.
  }, [courses, tab, level, query, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps
  const hasQuery = query.trim() !== ''

  return (
    <PageBackground className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platform courses and everything you've generated, all in one place.
          </p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      <div className="mt-6 inline-flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              tab === id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {isCourseTab && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            aria-label="Filter by level"
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-400"
          >
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort courses"
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-400"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'quizzes' && <QuizzesTab />}

      {isCourseTab && status === 'loading' && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isCourseTab && status === 'error' && (
        <div className="mt-8">
          <ErrorMessage message={error} onRetry={reload} />
        </div>
      )}

      {isCourseTab && status === 'success' && visibleCourses.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
        >
          <EmptyStateIllustration className="h-32 w-32" />
          <p className="text-slate-500">
            {tab === 'my-courses' ? "You haven't generated a course yet." : 'No platform courses yet.'}
          </p>
          {tab === 'my-courses' && (
            <Link
              to="/create"
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
            >
              <Plus className="h-4 w-4" />
              Generate your first course
            </Link>
          )}
        </motion.div>
      )}

      {isCourseTab && status === 'success' && visibleCourses.length > 0 && (hasQuery || level) && searchedCourses.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
        >
          <NoSearchResultsIllustration className="h-32 w-32" />
          <p className="text-slate-500">
            {hasQuery ? <>No results for &ldquo;{query.trim()}&rdquo;</> : 'No courses at that level.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setLevel('')
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {isCourseTab && status === 'success' && searchedCourses?.length > 0 && (
        <motion.div
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {searchedCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </motion.div>
      )}
    </PageBackground>
  )
}

export default CourseList
