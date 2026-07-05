import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CircleCheck, Search } from 'lucide-react'
import QuizStatusBadge from './QuizStatusBadge'
import { moduleProgress } from '../utils/progress'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'incomplete', label: 'Incomplete' },
]

function ModuleSection({ module, courseId, completedSet, activeLessonId, search, filter, forceOpen }) {
  const [open, setOpen] = useState(forceOpen)
  const { allLessonsComplete } = moduleProgress(module, completedSet)

  const lessons = (module.lessons ?? []).filter((lesson) => {
    if (search && !lesson.title.toLowerCase().includes(search.toLowerCase())) return false
    const isComplete = completedSet.has(lesson.id)
    if (filter === 'completed' && !isComplete) return false
    if (filter === 'incomplete' && isComplete) return false
    return true
  })

  if (lessons.length === 0) return null

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="min-w-0 truncate text-sm font-medium text-slate-800">{module.title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className="px-3 pb-1.5">
        <QuizStatusBadge allLessonsComplete={allLessonsComplete} module={module} />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-0.5 pb-2">
              {lessons.map((lesson) => {
                const isComplete = completedSet.has(lesson.id)
                const isActive = lesson.id === activeLessonId
                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/course/${courseId}/lesson/${lesson.id}`}
                      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm transition ${
                        isActive
                          ? 'border-l-2 border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-l-2 border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{lesson.title}</span>
                      {isComplete && (
                        <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success-600" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CourseSidebar({ course, activeLessonId }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const completedSet = new Set(course.completed_lesson_ids ?? [])

  const activeModuleId = activeLessonId
    ? course.modules.find((m) => m.lessons?.some((l) => l.id === activeLessonId))?.id
    : course.modules?.[0]?.id

  return (
    <aside className="hidden shrink-0 self-start lg:sticky lg:top-0 lg:block lg:max-h-[calc(100vh-3.5rem)] lg:w-72 lg:overflow-y-auto lg:border-r lg:border-slate-200">
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-sm outline-none focus:border-primary-400 focus:bg-white"
          />
        </div>
        <div className="mt-2 flex gap-1.5">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                filter === id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex flex-col">
        {course.modules.map((module) => (
          <ModuleSection
            key={module.id}
            module={module}
            courseId={course._id}
            completedSet={completedSet}
            activeLessonId={activeLessonId}
            search={search}
            filter={filter}
            forceOpen={module.id === activeModuleId}
          />
        ))}
      </nav>
    </aside>
  )
}

export default CourseSidebar
