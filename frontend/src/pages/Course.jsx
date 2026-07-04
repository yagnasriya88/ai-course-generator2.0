import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, ChevronDown, CircleCheck, Layers, Lock } from 'lucide-react'
import { getCourse } from '../utils/api'
import useFetch from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import QuizPanel from '../components/QuizPanel'
import { fadeInUp, staggerContainer } from '../utils/motion'
import { courseProgress, courseModuleStats, moduleProgress } from '../utils/progress'

function QuizStatusBadge({ allLessonsComplete, module }) {
  if (!allLessonsComplete) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
        <Lock className="h-3 w-3" />
        Quiz locked
      </span>
    )
  }
  if (module.quiz_completed) {
    return (
      <span className="rounded-full bg-success-500/10 px-2.5 py-0.5 text-xs font-semibold text-success-600">
        Quiz passed · {module.quiz_score}/{module.quiz_total}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-accent-400/10 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
      Quiz pending
    </span>
  )
}

function ModuleAccordion({ module, index, courseId, completedSet, defaultOpen, onQuizResult }) {
  const [open, setOpen] = useState(defaultOpen)
  const { completed, total, percent, allLessonsComplete, isModuleComplete } = moduleProgress(
    module,
    completedSet,
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              isModuleComplete
                ? 'bg-success-500/10 text-success-600'
                : 'bg-primary-50 text-primary-700'
            }`}
          >
            {isModuleComplete ? <CircleCheck className="h-4 w-4" /> : index + 1}
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-slate-900">{module.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-400">
                {completed}/{total} lessons · {percent}% complete
              </p>
              <QuizStatusBadge allLessonsComplete={allLessonsComplete} module={module} />
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-3 py-3">
              <ul className="flex flex-col gap-1.5">
                {module.lessons.map((lesson, li) => {
                  const isComplete = completedSet.has(lesson.id)
                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/course/${courseId}/lesson/${lesson.id}`}
                        className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                            {li + 1}
                          </span>
                          <span className="text-slate-700 group-hover:text-primary-700">
                            {lesson.title}
                          </span>
                        </span>
                        {isComplete && (
                          <CircleCheck
                            className="h-4 w-4 shrink-0 text-success-600"
                            title="Completed"
                          />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <QuizPanel
                courseId={courseId}
                module={module}
                allLessonsComplete={allLessonsComplete}
                onResult={(res) => onQuizResult(module.id, res)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Course() {
  const { courseId } = useParams()
  const {
    data: course,
    status,
    error,
    reload,
    setData: setCourse,
  } = useFetch(() => getCourse(courseId), [courseId])

  if (status === 'loading') return <LoadingSpinner label="Loading course…" />
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage message={error} onRetry={reload} />
      </div>
    )
  }

  // Patch the module in place rather than refetching the whole course — a full
  // reload() flips this page back to its loading state, unmounting QuizPanel and
  // wiping the just-submitted score/feedback before the learner can see it.
  function handleQuizResult(moduleId, res) {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId
          ? { ...m, quiz_completed: res.passed, quiz_score: res.score, quiz_total: res.total }
          : m,
      ),
    }))
  }

  const completedSet = new Set(course.completed_lesson_ids ?? [])
  const { percent, lessonsCompleted, lessonsTotal } = courseProgress(course)
  const { completedModules, totalModules } = courseModuleStats(course)

  return (
    <motion.div
      className="mx-auto max-w-3xl px-6 py-10"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      <Link to="/courses" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mt-3 flex flex-wrap gap-2">
        {course.level && (
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium capitalize text-primary-700">
            {course.level}
          </span>
        )}
        {course.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">{course.title}</h1>
      <p className="mt-2 text-slate-500">{course.description}</p>

      <div className="mt-5 flex items-center gap-5 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          {course.modules.length} modules
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          {lessonsTotal} lessons
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {percent}% complete · {lessonsCompleted}/{lessonsTotal} lessons ·{' '}
          {completedModules}/{totalModules} modules
        </p>
      </div>

      <motion.div
        className="mt-8 flex flex-col gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {course.modules.map((module, mi) => (
          <motion.div key={module.id} variants={fadeInUp}>
            <ModuleAccordion
              module={module}
              index={mi}
              courseId={course._id}
              completedSet={completedSet}
              defaultOpen={mi === 0}
              onQuizResult={handleQuizResult}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default Course
