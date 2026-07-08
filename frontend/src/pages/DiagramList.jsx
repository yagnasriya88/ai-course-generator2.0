import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { deleteDiagram, duplicateDiagram, listDiagrams, updateDiagram } from '../utils/api'
import useFetch from '../hooks/useFetch'
import DiagramCard from '../components/DiagramCard'
import ErrorMessage from '../components/ErrorMessage'
import PageBackground from '../components/PageBackground'
import Skeleton from '../components/Skeleton'
import EmptyStateIllustration from '../components/illustrations/EmptyStateIllustration'
import NoSearchResultsIllustration from '../components/illustrations/NoSearchResultsIllustration'
import { DIAGRAM_TYPES } from '../data/diagramTypes'
import { usePageMotion } from '../utils/motion'

const SORTS = [
  { id: 'newest', label: 'Recently edited' },
  { id: 'alphabetical', label: 'A–Z' },
]

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function DiagramList() {
  const { data: diagrams, status, error, reload, setData } = useFetch(() => listDiagrams(), [])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const { fadeInUp, staggerContainer } = usePageMotion()

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    return diagrams
      ?.filter((d) => !typeFilter || d.diagram_type === typeFilter)
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .sort((a, b) =>
        sortBy === 'alphabetical'
          ? a.title.localeCompare(b.title)
          : new Date(b.updated_at) - new Date(a.updated_at)
      )
  }, [diagrams, typeFilter, query, sortBy])
  const hasQuery = query.trim() !== ''

  function patchLocal(id, patch) {
    setData((prev) => prev.map((d) => (d._id === id ? { ...d, ...patch } : d)))
  }

  async function handleRename(id, title) {
    patchLocal(id, { title })
    try {
      await updateDiagram(id, { title })
    } catch {
      reload()
    }
  }

  async function handleToggleFavorite(id, isFavorite) {
    patchLocal(id, { is_favorite: isFavorite })
    try {
      await updateDiagram(id, { is_favorite: isFavorite })
    } catch {
      reload()
    }
  }

  async function handleDuplicate(id) {
    try {
      await duplicateDiagram(id)
      reload()
    } catch {
      reload()
    }
  }

  async function handleDelete(id) {
    const previous = diagrams
    setData((prev) => prev.filter((d) => d._id !== id))
    try {
      await deleteDiagram(id)
    } catch {
      setData(previous)
    }
  }

  return (
    <PageBackground className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Diagrams</h1>
          <p className="mt-1 text-sm text-slate-500">Every diagram you've generated with Knowledge Canvas.</p>
        </div>
        <Link
          to="/canvas"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          New Diagram
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search diagrams…"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by diagram type"
          className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-400"
        >
          <option value="">All types</option>
          {DIAGRAM_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort diagrams"
          className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-400"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-8">
          <ErrorMessage message={error} onRetry={reload} />
        </div>
      )}

      {status === 'success' && diagrams.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
        >
          <EmptyStateIllustration className="h-32 w-32" />
          <p className="text-slate-500">You haven&apos;t generated a diagram yet.</p>
          <Link
            to="/canvas"
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Generate your first diagram
          </Link>
        </motion.div>
      )}

      {status === 'success' && diagrams.length > 0 && (hasQuery || typeFilter) && searched.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
        >
          <NoSearchResultsIllustration className="h-32 w-32" />
          <p className="text-slate-500">
            {hasQuery ? <>No results for &ldquo;{query.trim()}&rdquo;</> : 'No diagrams of that type.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setTypeFilter('')
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {status === 'success' && searched?.length > 0 && (
        <motion.div
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {searched.map((diagram) => (
            <DiagramCard
              key={diagram._id}
              diagram={diagram}
              onRename={(title) => handleRename(diagram._id, title)}
              onDuplicate={() => handleDuplicate(diagram._id)}
              onDelete={() => handleDelete(diagram._id)}
              onToggleFavorite={(isFavorite) => handleToggleFavorite(diagram._id, isFavorite)}
            />
          ))}
        </motion.div>
      )}
    </PageBackground>
  )
}

export default DiagramList
