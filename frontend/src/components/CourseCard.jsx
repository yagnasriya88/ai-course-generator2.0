import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Layers } from 'lucide-react'
import { fadeInUp } from '../utils/motion'
import { coverGradient } from '../utils/coverGradient'
import { courseProgress } from '../utils/progress'

function CourseCard({ course }) {
  const gradient = coverGradient(course._id)
  const moduleCount = course.modules?.length ?? 0
  const { percent, lessonsCompleted, lessonsTotal } = courseProgress(course)

  return (
    <motion.div variants={fadeInUp}>
      <Link
        to={`/course/${course._id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
      >
        <div
          className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}
        >
          <span className="font-display text-4xl font-bold text-white/90">
            {course.title?.[0]?.toUpperCase() ?? '?'}
          </span>
          {course.level && (
            <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
              {course.level}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="line-clamp-1 font-display text-base font-semibold text-slate-900">
              {course.title}
            </h3>
            {course.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.description}</p>
            )}
          </div>

          <div className="mt-auto flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {moduleCount} module{moduleCount === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {lessonsTotal} lesson{lessonsTotal === 1 ? '' : 's'}
            </span>
          </div>

          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {lessonsCompleted}/{lessonsTotal} lessons · {percent}% complete
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default CourseCard
