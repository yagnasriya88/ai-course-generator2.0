import { motion } from 'framer-motion'
import Markdown from './Markdown'

function VideoNotes({ notes }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <Markdown content={notes.summary} className="text-slate-600" />

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

export default VideoNotes
