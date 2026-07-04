import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { listCourses } from '../utils/api'
import useFetch from '../hooks/useFetch'
import ErrorMessage from '../components/ErrorMessage'
import Skeleton from '../components/Skeleton'
import CourseCard from '../components/CourseCard'
import { fadeInUp, staggerContainer } from '../utils/motion'

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your generated courses, all in one place.</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {status === 'loading' && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-8">
          <ErrorMessage message={error} onRetry={reload} />
        </div>
      )}

      {status === 'success' && courses.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
        >
          <p className="text-slate-500">No courses yet.</p>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Generate your first course
          </Link>
        </motion.div>
      )}

      {status === 'success' && courses.length > 0 && (
        <motion.div
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default CourseList
