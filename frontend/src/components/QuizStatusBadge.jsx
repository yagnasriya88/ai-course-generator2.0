import { Lock } from 'lucide-react'

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

export default QuizStatusBadge
