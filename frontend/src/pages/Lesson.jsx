import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CircleCheck, Sparkles } from 'lucide-react'
import { getCourse, getLesson, setLessonCompleted } from '../utils/api'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { useForceSidebarCollapsed } from '../context/UIContext'
import LessonRenderer from '../components/LessonRenderer'
import VideoPanel from '../components/VideoPanel'
import HinglishPanel from '../components/HinglishPanel'
import VisualAidPanel from '../components/VisualAidPanel'
import AITutorPanel from '../components/AITutorPanel'
import CourseSidebar from '../components/CourseSidebar'
import PageBackground from '../components/PageBackground'
import RewardPopup from '../components/RewardPopup'
import ErrorMessage from '../components/ErrorMessage'
import Skeleton from '../components/Skeleton'
import { usePageMotion } from '../utils/motion'
import { courseProgress, lessonNavigation } from '../utils/progress'

function LessonSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-4 h-16 w-full" />
      <div className="mt-10 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    </div>
  )
}

function Lesson() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { data: lesson, status, error, reload } = useFetch(() => getLesson(lessonId), [lessonId])
  const { fadeInUp } = usePageMotion()
  const { data: course, setData: setCourse } = useFetch(() => getCourse(courseId), [courseId])
  const { updateUser } = useAuth()
  const [tutorOpen, setTutorOpen] = useState(false)
  const [togglingComplete, setTogglingComplete] = useState(false)
  const [reward, setReward] = useState(null)
  const [courseCelebration, setCourseCelebration] = useState(null)
  useForceSidebarCollapsed()

  const completed = (course?.completed_lesson_ids ?? []).includes(lessonId)

  async function toggleComplete() {
    if (togglingComplete) return
    const next = !completed
    setTogglingComplete(true)
    try {
      const result = await setLessonCompleted(lessonId, next)

      // Computed from the current `course` snapshot (not inside the setCourse
      // updater) so the "just completed the whole course" check runs exactly
      // once against a clean before/after diff, rather than relying on a
      // variable mutated from within a functional state update.
      const ids = new Set(course?.completed_lesson_ids ?? [])
      if (next) ids.add(lessonId)
      else ids.delete(lessonId)
      const updatedCourse = course ? { ...course, completed_lesson_ids: [...ids] } : null
      const beforePercent = course ? courseProgress(course).percent : 0
      const afterPercent = updatedCourse ? courseProgress(updatedCourse).percent : 0
      const courseJustCompleted = next && beforePercent < 100 && afterPercent === 100

      setCourse((prev) => {
        if (!prev) return prev
        const prevIds = new Set(prev.completed_lesson_ids ?? [])
        if (next) prevIds.add(lessonId)
        else prevIds.delete(lessonId)
        return { ...prev, completed_lesson_ids: [...prevIds] }
      })

      if (courseJustCompleted) {
        setCourseCelebration({ courseTitle: course.title })
      }

      if (result.xp_total !== undefined) {
        updateUser({
          xp: result.xp_total,
          gold: result.gold_total,
          level: result.level,
          xp_into_level: result.xp_into_level,
          xp_to_next: result.xp_to_next,
        })
        // Skip the routine per-lesson popup when the bigger course-completion
        // celebration is about to show — avoid stacking two full-screen modals.
        if (next && !courseJustCompleted) {
          setReward({
            xpAwarded: result.xp_awarded,
            goldAwarded: result.gold_awarded,
            level: result.level,
            leveledUp: result.leveled_up,
          })
        }
      }
    } catch {
      // non-critical — leave state unchanged on failure
    } finally {
      setTogglingComplete(false)
    }
  }

  if (status === 'loading') return <LessonSkeleton />
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage message={error} onRetry={reload} />
      </div>
    )
  }

  const { prev: prevLesson, next: nextLesson } = course
    ? lessonNavigation(course, lessonId)
    : { prev: null, next: null }

  return (
    <PageBackground tone="calm" className="flex">
      {course && <CourseSidebar course={course} activeLessonId={lessonId} />}

      <motion.div className="flex-1" initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/60 bg-white/70 px-6 py-3 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={`/course/${courseId}`}
              className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Back to course"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="truncate text-sm font-medium text-slate-700">{lesson.title}</span>
          </div>
          <button
            type="button"
            onClick={() => setTutorOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="font-display text-3xl font-bold text-slate-900">{lesson.title}</h1>
            <button
              type="button"
              onClick={toggleComplete}
              disabled={togglingComplete}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                completed
                  ? 'bg-success-500/10 text-success-600 hover:bg-success-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              <CircleCheck className="h-4 w-4" />
              {completed ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>

          {lesson.objectives?.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {lesson.objectives.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary-500">•</span>
                  {o}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <LessonRenderer content={lesson.content} />
          </div>

          <VisualAidPanel aids={lesson.visual_aids} />
          <VideoPanel courseId={courseId} lessonId={lessonId} videos={lesson.videos} />
          <HinglishPanel lessonId={lessonId} initialHinglish={lesson.hinglish} />

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
            {prevLesson ? (
              <button
                type="button"
                onClick={() => navigate(`/course/${courseId}/lesson/${prevLesson.id}`)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous lesson
              </button>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <button
                type="button"
                onClick={() => navigate(`/course/${courseId}/lesson/${nextLesson.id}`)}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
              >
                Next lesson
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/course/${courseId}`)}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
              >
                Back to course
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <AITutorPanel lessonId={lessonId} open={tutorOpen} onClose={() => setTutorOpen(false)} />
      </motion.div>

      <RewardPopup reward={reward} onClose={() => setReward(null)} />
      <RewardPopup
        variant="course"
        reward={courseCelebration}
        onClose={() => setCourseCelebration(null)}
      />
    </PageBackground>
  )
}

export default Lesson
