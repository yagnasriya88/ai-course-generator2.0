import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages } from 'lucide-react'
import { generateHinglish } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

function HinglishPanel({ lessonId, initialHinglish }) {
  const [hinglish, setHinglish] = useState(initialHinglish || null)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)

  async function handleClick() {
    if (hinglish) return
    setStatus('loading')
    setError(null)
    try {
      const result = await generateHinglish(lessonId)
      setHinglish(result)
      setStatus('idle')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
        <Languages className="h-4 w-4 text-accent-600" />
        Hinglish explanation
      </h2>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading'}
        className="mt-4 flex items-center gap-2 rounded-xl border border-accent-500/40 bg-accent-400/10 px-4 py-2.5 text-sm font-semibold text-accent-600 transition hover:bg-accent-400/20 disabled:opacity-60"
      >
        {status === 'loading' ? 'Translating…' : 'Explain in Hinglish'}
      </button>

      {status === 'loading' && <LoadingSpinner />}
      {status === 'error' && (
        <div className="mt-3">
          <ErrorMessage message={error} onRetry={handleClick} />
        </div>
      )}

      <AnimatePresence>
        {hinglish && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
              {hinglish.text}
            </p>
            {hinglish.audio_base64 && (
              <audio
                controls
                className="mt-3 w-full"
                src={`data:audio/wav;base64,${hinglish.audio_base64}`}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default HinglishPanel
