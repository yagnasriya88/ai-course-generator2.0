import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from './LottiePlayer'
import { HelpCircle, Lock } from 'lucide-react'
import { getModuleQuiz, submitModuleQuiz } from '../utils/api'
import ErrorMessage from './ErrorMessage'
import successCheckAnimation from '../assets/lottie/success-check.json'

function QuizPassBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4 flex items-center gap-2 rounded-xl bg-success-500/10 px-4 py-2.5 text-sm font-semibold text-success-600"
    >
      <Lottie animationData={successCheckAnimation} loop={false} className="h-8 w-8" />
      Nice work — quiz passed!
    </motion.div>
  )
}

function QuestionInput({ question, value, onChange, disabled }) {
  if (question.type === 'mcq' || question.type === 'true_false') {
    return (
      <div className="mt-3 flex flex-col gap-2">
        {question.options?.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
              value === option
                ? 'border-primary-400 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              disabled={disabled}
              className="accent-primary-600"
            />
            <span className="text-slate-700">{option}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Your answer"
      className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 disabled:opacity-70"
    />
  )
}

function QuizPanel({ courseId, module, allLessonsComplete, onResult }) {
  const [quiz, setQuiz] = useState(module.quiz ?? [])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | submitting | error
  const [error, setError] = useState(null)
  const [showPassBanner, setShowPassBanner] = useState(false)

  useEffect(() => {
    setQuiz(module.quiz ?? [])
  }, [module.quiz])

  if (!allLessonsComplete) {
    return (
      <section className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
        <Lock className="h-4 w-4 shrink-0" />
        Complete all lessons in this module to unlock the quiz.
      </section>
    )
  }

  async function handleStart() {
    setStatus('loading')
    setError(null)
    try {
      const q = await getModuleQuiz(courseId, module.id)
      setQuiz(q)
      setStatus('idle')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  async function handleSubmit() {
    setStatus('submitting')
    setError(null)
    try {
      const res = await submitModuleQuiz(courseId, module.id, answers)
      setResult(res)
      setStatus('idle')
      onResult?.(res)
      if (res.passed) {
        setShowPassBanner(true)
        setTimeout(() => setShowPassBanner(false), 2500)
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function handleRetake() {
    setAnswers({})
    setResult(null)
  }

  if (quiz.length === 0) {
    return (
      <section className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-md shadow-glow">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <HelpCircle className="h-4 w-4 text-primary-600" />
            Module quiz unlocked
          </p>
          <button
            type="button"
            onClick={handleStart}
            disabled={status === 'loading'}
            className="shrink-0 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Preparing…' : 'Start Module Quiz'}
          </button>
        </div>
        {status === 'error' && (
          <div className="mt-3">
            <ErrorMessage message={error} onRetry={handleStart} />
          </div>
        )}
      </section>
    )
  }

  const resultsByQuestion = Object.fromEntries(
    (result?.results || []).map((r) => [r.question_id, r]),
  )
  const badge = result
    ? { passed: result.passed, score: result.score, total: result.total }
    : module.quiz_completed
      ? { passed: true, score: module.quiz_score, total: module.quiz_total }
      : null

  return (
    <section className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur-md shadow-glow">
      <AnimatePresence>{showPassBanner && <QuizPassBanner />}</AnimatePresence>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
          <HelpCircle className="h-4 w-4 text-primary-600" />
          Module Quiz
        </h3>
        {badge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              badge.passed
                ? 'bg-success-500/10 text-success-600'
                : 'bg-danger-500/10 text-danger-600'
            }`}
          >
            {badge.score} / {badge.total} · {badge.passed ? 'Passed' : 'Try again'}
          </motion.span>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {quiz.map((question, i) => {
          const qResult = resultsByQuestion[question.id]
          return (
            <div key={question.id}>
              <p className="text-sm font-medium text-slate-800">
                {i + 1}. {question.question}
              </p>
              <QuestionInput
                question={question}
                value={answers[question.id]}
                onChange={(val) => setAnswers((a) => ({ ...a, [question.id]: val }))}
                disabled={!!result}
              />
              {qResult && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                    qResult.correct
                      ? 'bg-success-500/10 text-success-600'
                      : 'bg-danger-500/10 text-danger-600'
                  }`}
                >
                  <p className="font-semibold">
                    {qResult.correct ? 'Correct' : `Correct answer: ${qResult.correct_answer}`}
                  </p>
                  <p className="mt-0.5 text-slate-600">{qResult.explanation}</p>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {status === 'error' && (
        <div className="mt-4">
          <ErrorMessage message={error} onRetry={handleSubmit} />
        </div>
      )}

      <div className="mt-6">
        {!result ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'submitting' || Object.keys(answers).length === 0}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'submitting' ? 'Grading…' : 'Submit answers'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
          >
            Retake quiz
          </button>
        )}
      </div>
    </section>
  )
}

export default QuizPanel
