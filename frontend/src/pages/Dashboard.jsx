import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Coins,
  Flame,
  GraduationCap,
  PlusCircle,
  Star,
} from 'lucide-react'
import { getDashboard } from '../utils/api'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { bucketActivityByDay, continueLearningCourses, dashboardStats } from '../utils/progress'
import CourseCard from '../components/CourseCard'
import WeeklyActivityBars from '../components/WeeklyActivityBars'
import PageBackground from '../components/PageBackground'
import StudyingIllustration from '../components/illustrations/StudyingIllustration'
import EmptyStateIllustration from '../components/illustrations/EmptyStateIllustration'
import ErrorMessage from '../components/ErrorMessage'
import Skeleton from '../components/Skeleton'
import { usePageMotion } from '../utils/motion'

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function StatCard({ icon: Icon, iconClass, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-md shadow-glow">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-xl font-bold tabular-nums text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Skeleton className="h-8 w-64" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="mt-8 h-6 w-40" />
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const { data, status, error, reload } = useFetch(() => getDashboard(), [])
  const { fadeInUp, staggerContainer } = usePageMotion()

  if (status === 'loading') return <DashboardSkeleton />
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage message={error} onRetry={reload} />
      </div>
    )
  }

  const { courses, recent_activity: recentActivity } = data
  const stats = dashboardStats(courses)
  const continueLearning = continueLearningCourses(courses)
  const weeklyData = bucketActivityByDay(recentActivity)
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hasAnyActivity = recentActivity.length > 0

  return (
    <PageBackground className="mx-auto max-w-6xl px-6 py-10">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex items-center justify-between gap-6 rounded-3xl border border-white/60 bg-white/70 p-6 backdrop-blur-md shadow-glow sm:p-8"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Hi, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {' · '}
            {hasAnyActivity ? "Here's how your learning is going." : 'Ready to start learning?'}
          </p>
        </div>
        <StudyingIllustration className="hidden h-28 w-28 shrink-0 sm:block" />
      </motion.div>

      <motion.div
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={Flame}
            iconClass="bg-orange-50 text-orange-500"
            label={`day streak${(user?.current_streak ?? 0) === 1 ? '' : 's'}`}
            value={user?.current_streak ?? 0}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={Star}
            iconClass="bg-accent-400/15 text-accent-500"
            label={`level ${user?.level ?? 1} · ${user?.xp_to_next ?? 500} XP to next`}
            value={`${user?.xp ?? 0} XP`}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={Coins}
            iconClass="bg-amber-50 text-amber-600"
            label="gold coins"
            value={user?.gold ?? 0}
          />
        </motion.div>
      </motion.div>

      {continueLearning.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900">Continue Learning</h2>
            <Link
              to="/courses"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <motion.div
            className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {continueLearning.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </motion.div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-md shadow-glow lg:col-span-3">
          <h2 className="font-display text-base font-semibold text-slate-900">This week</h2>
          <div className="mt-4">
            <WeeklyActivityBars data={weeklyData} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
            <div>
              <p className="font-display text-lg font-bold text-slate-900">{stats.lessonsCompleted}</p>
              <p className="text-xs text-slate-500">lessons done</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-slate-900">{stats.coursesInProgress}</p>
              <p className="text-xs text-slate-500">in progress</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-slate-900">{stats.coursesCompleted}</p>
              <p className="text-xs text-slate-500">completed</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-md shadow-glow lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-slate-900">Recent activity</h2>
          {hasAnyActivity ? (
            <ul className="mt-4 flex flex-col gap-3">
              {recentActivity.slice(0, 6).map((entry) => (
                <li key={entry._id} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">{entry.lesson_title}</p>
                    <p className="truncate text-xs text-slate-400">
                      {entry.course_title} · {timeAgo(entry.completed_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-400/15 px-2 py-0.5 text-xs font-semibold text-accent-600 tabular-nums">
                    +{entry.xp_awarded} XP
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <EmptyStateIllustration className="h-28 w-28" />
              <p className="text-sm text-slate-500">No activity yet — complete a lesson to see it here.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/create"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
        >
          <PlusCircle className="h-4 w-4" />
          Generate a new course
        </Link>
        <Link
          to="/courses"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-md transition hover:border-primary-300 hover:text-primary-700"
        >
          <BookOpen className="h-4 w-4" />
          Browse courses
        </Link>
        {continueLearning.length === 0 && (
          <Link
            to="/courses"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-md transition hover:border-primary-300 hover:text-primary-700"
          >
            <GraduationCap className="h-4 w-4" />
            Start "Introduction to Machine Learning"
          </Link>
        )}
      </div>
    </PageBackground>
  )
}

export default Dashboard
