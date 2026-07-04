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
