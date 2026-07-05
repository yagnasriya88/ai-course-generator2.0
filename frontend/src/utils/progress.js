export function courseLessons(course) {
  return course.modules?.flatMap((m) => m.lessons ?? []) ?? []
}

// Blended progress: each module contributes its lessons plus one "quiz unit" to the
// total, so the percentage climbs per-lesson and gets a final bump when the module's
// quiz is passed. `lessonsCompleted`/`lessonsTotal` are also returned since the UI wants
// to show a plain "X/Y lessons" stat alongside the blended percent.
export function courseProgress(course) {
  const modules = course.modules ?? []
  const completedSet = new Set(course.completed_lesson_ids ?? [])
  let totalUnits = 0
  let completedUnits = 0
  let lessonsTotal = 0
  let lessonsCompleted = 0

  for (const module of modules) {
    const lessons = module.lessons ?? []
    totalUnits += lessons.length + 1
    lessonsTotal += lessons.length
    const completedInModule = lessons.filter((l) => completedSet.has(l.id)).length
    completedUnits += completedInModule
    lessonsCompleted += completedInModule
    if (module.quiz_completed) completedUnits += 1
  }

  const percent = totalUnits === 0 ? 0 : Math.round((completedUnits / totalUnits) * 100)
  return { completed: completedUnits, total: totalUnits, percent, lessonsCompleted, lessonsTotal }
}

// Flat prev/next lookup across module boundaries, reusing courseLessons'
// already-in-order flattening — module-boundary transitions fall out for free.
export function lessonNavigation(course, currentLessonId) {
  const flat = courseLessons(course)
  const index = flat.findIndex((l) => l.id === currentLessonId)
  if (index === -1) return { prev: null, next: null, index: -1, total: flat.length }
  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
    index,
    total: flat.length,
  }
}

export function moduleProgress(module, completedSet) {
  const lessons = module.lessons ?? []
  const total = lessons.length
  const completed = lessons.filter((l) => completedSet.has(l.id)).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const allLessonsComplete = total > 0 && completed === total
  const isModuleComplete = allLessonsComplete && !!module.quiz_completed
  return { completed, total, percent, allLessonsComplete, isModuleComplete }
}

export function courseModuleStats(course) {
  const modules = course.modules ?? []
  const completedSet = new Set(course.completed_lesson_ids ?? [])
  const completedModules = modules.filter(
    (m) => moduleProgress(m, completedSet).isModuleComplete,
  ).length
  return { completedModules, totalModules: modules.length }
}

// Aggregate dashboard-level numbers across every course a user has — kept as
// pure client-side math alongside the rest of this file rather than
// duplicating it server-side.
export function dashboardStats(courses) {
  let lessonsCompleted = 0
  let coursesInProgress = 0
  let coursesCompleted = 0

  for (const course of courses ?? []) {
    const { percent, lessonsCompleted: completed } = courseProgress(course)
    lessonsCompleted += completed
    if (percent >= 100) coursesCompleted += 1
    else if (percent > 0) coursesInProgress += 1
  }

  return { lessonsCompleted, coursesInProgress, coursesCompleted }
}

export function continueLearningCourses(courses, limit = 4) {
  return (courses ?? [])
    .filter((course) => {
      const { percent } = courseProgress(course)
      return percent > 0 && percent < 100
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, limit)
}

// Buckets activity entries into the last `days` calendar days (local time),
// zero-filling days with no activity, for a compact weekly bar chart.
export function bucketActivityByDay(activity, days = 7) {
  const buckets = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    buckets.push({ date, count: 0 })
  }

  for (const entry of activity ?? []) {
    const entryDate = new Date(entry.completed_at)
    entryDate.setHours(0, 0, 0, 0)
    const bucket = buckets.find((b) => b.date.getTime() === entryDate.getTime())
    if (bucket) bucket.count += 1
  }

  return buckets.map((b) => ({
    label: b.date.toLocaleDateString(undefined, { weekday: 'short' }),
    count: b.count,
  }))
}
