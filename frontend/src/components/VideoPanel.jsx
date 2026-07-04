import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
import { getVideoNotes } from '../utils/api'
import { getYoutubeEmbedUrl } from '../utils/youtube'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

function VideoNotes({ notes }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="text-slate-600">{notes.summary}</p>

        {notes.key_concepts?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Key concepts
            </p>
            <ul className="mt-1 list-inside list-disc text-slate-600">
              {notes.key_concepts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {notes.timestamps?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Timestamps
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {notes.timestamps.map((t, i) => (
                <li key={i} className="text-slate-600">
                  <span className="font-mono text-xs text-primary-600">{t.time}</span> {t.note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {notes.takeaways?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Takeaways
            </p>
            <ul className="mt-1 list-inside list-disc text-slate-600">
              {notes.takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function VideoCard({ lessonId, video }) {
  const [notes, setNotes] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)
  const embedUrl = getYoutubeEmbedUrl(video.url)

  async function handleGenerateNotes() {
    setStatus('loading')
    setError(null)
    try {
      const result = await getVideoNotes(lessonId, video.url)
      setNotes(result)
      setStatus('idle')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      {embedUrl && (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe
            src={embedUrl}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <p className="mt-2 text-sm font-medium text-slate-700">{video.title}</p>

      {!notes && (
        <button
          type="button"
          onClick={handleGenerateNotes}
          disabled={status === 'loading'}
          className="mt-2 text-xs font-semibold text-primary-600 hover:underline disabled:opacity-60"
        >
          {status === 'loading' ? 'Generating notes…' : 'Generate AI notes'}
        </button>
      )}

      {status === 'loading' && <LoadingSpinner />}
      {status === 'error' && (
        <div className="mt-2">
          <ErrorMessage message={error} onRetry={handleGenerateNotes} />
        </div>
      )}

      <AnimatePresence>{notes && <VideoNotes notes={notes} />}</AnimatePresence>
    </div>
  )
}

function VideoPanel({ lessonId, videos }) {
  if (!videos || videos.length === 0) return null

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
        <Play className="h-4 w-4 text-primary-600" />
        Watch &amp; learn
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {videos.map((video) => (
          <VideoCard key={video.url} lessonId={lessonId} video={video} />
        ))}
      </div>
    </section>
  )
}

export default VideoPanel
