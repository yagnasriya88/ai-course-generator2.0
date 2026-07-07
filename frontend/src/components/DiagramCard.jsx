import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, MoreVertical, Pencil, Star, Trash2 } from 'lucide-react'
import { fadeInUp } from '../utils/motion'
import { getDiagramType } from '../data/diagramTypes'
import { DIAGRAM_ILLUSTRATIONS } from './illustrations/DiagramIllustrations'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function DiagramCard({ diagram, onRename, onDuplicate, onDelete, onToggleFavorite }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [titleDraft, setTitleDraft] = useState(diagram.title)

  const type = getDiagramType(diagram.diagram_type)
  const Illustration = DIAGRAM_ILLUSTRATIONS[diagram.diagram_type]

  function commitRename() {
    setRenaming(false)
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== diagram.title) onRename(trimmed)
    else setTitleDraft(diagram.title)
  }

  return (
    <motion.div variants={fadeInUp} className="relative">
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-glow transition hover:-translate-y-0.5 hover:shadow-glow">
        <div
          className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${type?.gradient || 'from-slate-400 to-slate-600'}`}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1.5px,transparent_1.5px)] [background-size:16px_16px]"
          />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 p-2 shadow-sm">
            {Illustration && <Illustration className="h-full w-full" />}
          </span>
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-700 uppercase">
            {type?.name || diagram.diagram_type}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(!diagram.is_favorite)}
            aria-label={diagram.is_favorite ? 'Unfavorite' : 'Favorite'}
            className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:scale-105"
          >
            <Star
              className={`h-3.5 w-3.5 ${diagram.is_favorite ? 'fill-accent-400 text-accent-500' : 'text-slate-400'}`}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {renaming ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setTitleDraft(diagram.title)
                  setRenaming(false)
                }
              }}
              className="rounded-lg border border-primary-300 px-2 py-1 text-base font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-primary-200"
            />
          ) : (
            <Link to={`/diagram/${diagram._id}`} className="line-clamp-1 font-display text-base font-semibold text-slate-900 hover:text-primary-700">
              {diagram.title}
            </Link>
          )}

          <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
            <span>Created {formatDate(diagram.created_at)}</span>
            <span className="rounded-full bg-success-500/10 px-2 py-0.5 font-medium text-success-700">Ready</span>
          </div>
          <p className="text-xs text-slate-400">Edited {formatDate(diagram.updated_at)}</p>
        </div>
      </div>

      <div className="absolute top-3 right-12">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Diagram actions"
          className="rounded-full bg-white/90 p-1.5 shadow-sm transition hover:bg-white"
        >
          <MoreVertical className="h-3.5 w-3.5 text-slate-600" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-40 mt-2 w-40 overflow-hidden rounded-xl border border-white/60 bg-white/95 py-1 shadow-xl backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setRenaming(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDuplicate()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default DiagramCard
