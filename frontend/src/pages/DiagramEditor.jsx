import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AIPromptBar from '../components/canvas/AIPromptBar'
import CanvasToolbar from '../components/canvas/CanvasToolbar'
import FlowCanvas from '../components/canvas/FlowCanvas'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import { useForceSidebarCollapsed } from '../context/UIContext'
import { getDiagramType } from '../data/diagramTypes'
import { useDiagramEditorStore } from '../store/diagramEditorStore'
import { getDiagram, updateDiagram } from '../utils/api'

const AUTOSAVE_DELAY_MS = 1500

function DiagramEditor() {
  useForceSidebarCollapsed()
  const { diagramId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [diagram, setDiagram] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveState, setSaveState] = useState('saved') // saved | saving

  const loadGraph = useDiagramEditorStore((s) => s.loadGraph)
  const toGraph = useDiagramEditorStore((s) => s.toGraph)
  const markSaved = useDiagramEditorStore((s) => s.markSaved)
  const dirty = useDiagramEditorStore((s) => s.dirty)
  const nodes = useDiagramEditorStore((s) => s.nodes)
  const edges = useDiagramEditorStore((s) => s.edges)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getDiagram(diagramId)
      .then((data) => {
        if (cancelled) return
        setDiagram(data)
        setTitleDraft(data.title)
        loadGraph(data)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramId])

  // Debounced auto-save — waits for a pause in editing (drag/AI-edit settled)
  // instead of saving on every intermediate frame.
  useEffect(() => {
    if (!dirty || status !== 'success') return
    setSaveState('saving')
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateDiagram(diagramId, toGraph())
      } finally {
        markSaved()
        setSaveState('saved')
      }
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(saveTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, nodes, edges])

  async function commitTitle() {
    setEditingTitle(false)
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === diagram.title) {
      setTitleDraft(diagram.title)
      return
    }
    setDiagram((d) => ({ ...d, title: trimmed }))
    try {
      await updateDiagram(diagramId, { title: trimmed })
    } catch {
      // Non-critical — a failed rename doesn't block continued editing.
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <ErrorMessage message={error} />
      </div>
    )
  }

  const type = getDiagramType(diagram.diagram_type)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate('/diagrams')}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Back to My Diagrams"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-primary-700 uppercase">
          {type?.name || diagram.diagram_type}
        </span>
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') {
                setTitleDraft(diagram.title)
                setEditingTitle(false)
              }
            }}
            className="rounded-lg border border-primary-300 px-2 py-1 font-display text-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-primary-200"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="rounded-lg px-2 py-1 text-left font-display text-lg font-semibold text-slate-900 hover:bg-slate-50"
          >
            {diagram.title}
          </button>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          {saveState === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saveState === 'saving' ? 'Saving…' : 'Saved'}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <ReactFlowProvider>
          <FlowCanvas />
          <CanvasToolbar title={diagram.title} />
        </ReactFlowProvider>
      </div>

      <AIPromptBar diagramId={diagramId} />
    </div>
  )
}

export default DiagramEditor
