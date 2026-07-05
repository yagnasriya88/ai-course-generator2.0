import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Layers, Sparkles } from 'lucide-react'
import { fadeInUp } from '../utils/motion'
import { coverGradient } from '../utils/coverGradient'
import { moduleIllustration } from '../utils/moduleIllustration'
import { courseProgress } from '../utils/progress'

function CourseCard({ course }) {
  const gradient = coverGradient(course._id)
  const CoverIllustration = moduleIllustration(course._id)
  const moduleCount = course.modules?.length ?? 0
  const { percent, lessonsCompleted, lessonsTotal } = courseProgress(course)
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = course.cover_image_url && !imageFailed

  return (
    <motion.div variants={fadeInUp}>
      <Link
        to={`/course/${course._id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-glow transition hover:-translate-y-0.5 hover:bg-white/80"
      >
        <div
          className={`relative flex h-32 items-center justify-center overflow-hidden ${
            showImage ? '' : `bg-gradient-to-br ${gradient}`
          }`}
        >
          {!showImage && (
            <div
              aria-hidden
              className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1.5px,transparent_1.5px)] [background-size:16px_16px]"
            />
          )}
          {showImage ? (
            <img
              src={course.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 p-2.5 shadow-sm">
              <CoverIllustration className="h-full w-full" />
            </span>
          )}
          {course.level && (
            <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
              {course.level}
            </span>
          )}
          {course.is_platform && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
              <Sparkles className="h-3 w-3" />
              Official
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
