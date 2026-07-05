import { useRef, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, Send, Sparkles } from 'lucide-react'
import { askAboutVideo, getLesson, getVideoNotes } from '../utils/api'
import useFetch from '../hooks/useFetch'
import { getYoutubeEmbedUrl } from '../utils/youtube'
import VideoNotes from '../components/VideoNotes'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Skeleton from '../components/Skeleton'
import PageBackground from '../components/PageBackground'

function VideoQA({ lessonId, videoUrl }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [pending, setPending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  async function handleSend(e) {
    e.preventDefault()
    const q = question.trim()
    if (!q || pending) return
    setQuestion('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setPending(true)
    try {
      const { answer } = await askAboutVideo(lessonId, videoUrl, q)
      setMessages((m) => [...m, { role: 'answer', text: answer }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'answer', text: `Sorry — ${err.message}`, isError: true }])
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-md shadow-glow">
      <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-slate-900">
        <MessageCircle className="h-4 w-4 text-primary-600" />
        Ask about this video
      </h2>

      <div ref={scrollRef} className="mt-3 max-h-64 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask a question about what's covered in this video.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'ml-auto bg-primary-600 text-white'
                  : m.isError
                    ? 'bg-danger-500/10 text-danger-600'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {m.text}
            </div>
          ))}
          {pending && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-slate-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this video…"
          disabled={pending}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !question.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Ask
        </button>
      </form>
    </div>
  )
}

function VideoDetail() {
  const { courseId, lessonId, videoIndex } = useParams()
  const { data: lesson, status, error, reload } = useFetch(() => getLesson(lessonId), [lessonId])
  const [notes, setNotes] = useState(null)
  const [notesStatus, setNotesStatus] = useState('idle')
  const [notesError, setNotesError] = useState(null)

  const video = lesson?.videos?.[Number(videoIndex)]

  async function handleGenerateNotes() {
    setNotesStatus('loading')
    setNotesError(null)
    try {
      const result = await getVideoNotes(lessonId, video.url)
      setNotes(result)
      setNotesStatus('idle')
    } catch (err) {
      setNotesError(err.message)
      setNotesStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <PageBackground tone="calm" className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="mt-4 h-6 w-2/3" />
      </PageBackground>
    )
  }

  if (status === 'error') {
    return (
      <PageBackground tone="calm" className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage message={error} onRetry={reload} />
      </PageBackground>
    )
  }

  if (!video) {
    return (
      <PageBackground tone="calm" className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage message="Video not found." />
      </PageBackground>
    )
  }

  const embedUrl = getYoutubeEmbedUrl(video.url)

  return (
    <PageBackground tone="calm" className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to={`/course/${courseId}/lesson/${lessonId}`}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lesson
      </Link>

      {embedUrl && (
        <div className="mt-4 aspect-video overflow-hidden rounded-2xl shadow-sm">
          <iframe
            src={embedUrl}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <h1 className="mt-4 font-display text-xl font-bold text-slate-900">{video.title}</h1>

      <div className="mt-6 flex flex-col gap-4">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-md shadow-glow">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-primary-600" />
              AI notes
            </h2>
            {!notes && (
              <button
                type="button"
                onClick={handleGenerateNotes}
                disabled={notesStatus === 'loading'}
                className="text-xs font-semibold text-primary-600 hover:underline disabled:opacity-60"
              >
                {notesStatus === 'loading' ? 'Generating…' : 'Generate AI notes'}
              </button>
            )}
          </div>
          {notesStatus === 'loading' && <LoadingSpinner />}
          {notesStatus === 'error' && (
            <div className="mt-2">
              <ErrorMessage message={notesError} onRetry={handleGenerateNotes} />
            </div>
          )}
          <AnimatePresence>{notes && <VideoNotes notes={notes} />}</AnimatePresence>
        </div>

        <VideoQA lessonId={lessonId} videoUrl={video.url} />
      </div>
    </PageBackground>
  )
}

export default VideoDetail
