import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Lightbulb, Sparkles } from 'lucide-react'
import ErrorMessage from '../components/ErrorMessage'
import PageBackground from '../components/PageBackground'
import { DIAGRAM_ILLUSTRATIONS } from '../components/illustrations/DiagramIllustrations'
import { useDiagramJobs } from '../context/DiagramJobsContext'
import { generateDiagram } from '../utils/api'
import { getDiagramType } from '../data/diagramTypes'
import { fadeInUp } from '../utils/motion'

const AGENT_STEPS = [
  'Knowledge Graph Agent is designing your diagram…',
  'Laying out nodes and connections…',
  'Almost ready…',
]

function GenerateDiagram() {
  const { diagramType } = useParams()
  const type = getDiagramType(diagramType)
  const location = useLocation()
  const navigate = useNavigate()
  const { activeJob, startTracking, stopTracking } = useDiagramJobs()

  const [topic, setTopic] = useState(location.state?.topic || '')
  const [submitError, setSubmitError] = useState(null)
  const [rejection, setRejection] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)

  const status = activeJob?.status === 'queued' || activeJob?.status === 'processing' ? 'loading' : 'idle'

  useEffect(() => {
    if (status !== 'loading') return
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, AGENT_STEPS.length - 1))
    }, 3500)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (activeJob?.status === 'completed') {
      const diagramId = activeJob.diagram_id
      stopTracking()
      navigate(`/diagram/${diagramId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.status])

  if (!type) return <Navigate to="/canvas" replace />

  const Illustration = DIAGRAM_ILLUSTRATIONS[type.key]

  async function submitJob() {
    setSubmitError(null)
    setRejection(null)
    setStepIndex(0)
    try {
      const job = await generateDiagram({ topic, diagram_type: type.key, detail: null })
      startTracking(job)
    } catch (err) {
      if (err.body?.valid === false) {
        setRejection(err.body)
      } else {
        setSubmitError(err.message)
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!topic.trim() || status === 'loading') return
    submitJob()
  }

  function handleRetry() {
    stopTracking()
    submitJob()
  }

  function handleSwitchType(suggestedType) {
    navigate(`/canvas/${suggestedType}`, { state: { topic } })
  }

  return (
    <PageBackground tone="accent" className="min-h-full">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col items-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 p-2.5 shadow-sm">
            {Illustration ? <Illustration className="h-full w-full" /> : <type.icon className="h-8 w-8" />}
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Generate a {type.name}
          </h1>
          <p className="mt-3 max-w-md text-slate-500">{type.longDescription}</p>
        </motion.div>

        <div className="mt-10 w-full rounded-2xl border border-white/60 bg-white/70 p-6 shadow-glow backdrop-blur-md">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`e.g. ${type.examplePrompts[0]}`}
                disabled={status === 'loading'}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === 'loading' || !topic.trim()}
                className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate {type.name}
              </button>
            </div>

            {status === 'idle' && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Try:
                </span>
                {type.examplePrompts.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setTopic(example)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}

            {status === 'loading' && (
              <div className="mt-8 flex flex-col items-center gap-3 text-slate-500">
                <motion.div
                  className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeJob?.status === 'queued' ? 'queued' : stepIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-sm"
                  >
                    {activeJob?.status === 'queued'
                      ? 'Queued — your diagram will start generating shortly…'
                      : AGENT_STEPS[stepIndex]}
                  </motion.p>
                </AnimatePresence>
                <p className="text-xs text-slate-400">
                  Feel free to navigate away — we&apos;ll let you know when it&apos;s ready.
                </p>
              </div>
            )}

            {rejection && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-start gap-2 rounded-xl border border-accent-500/30 bg-accent-400/10 p-4 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-accent-600">
                  <Lightbulb className="h-4 w-4 shrink-0" />
                  Let&apos;s refine this
                </div>
                <p className="text-sm text-slate-600">{rejection.reason}</p>
                {rejection.suggestion && (
                  <p className="text-sm text-slate-500">{rejection.suggestion}</p>
                )}
                {rejection.suggested_type && rejection.suggested_type !== type.key && (
                  <button
                    type="button"
                    onClick={() => handleSwitchType(rejection.suggested_type)}
                    className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-500"
                  >
                    Switch to {getDiagramType(rejection.suggested_type)?.name || rejection.suggested_type}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            )}

            {submitError && (
              <div className="mt-6">
                <ErrorMessage message={submitError} onRetry={handleSubmit} />
              </div>
            )}

            {activeJob?.status === 'failed' && (
              <div className="mt-6">
                <ErrorMessage message={activeJob.error || 'Diagram generation failed.'} onRetry={handleRetry} />
              </div>
            )}
          </form>
        </div>

        <Link to="/canvas" className="mt-6 text-xs font-medium text-slate-400 hover:text-primary-600">
          ← Choose a different diagram type
        </Link>
      </div>
    </PageBackground>
  )
}

export default GenerateDiagram
