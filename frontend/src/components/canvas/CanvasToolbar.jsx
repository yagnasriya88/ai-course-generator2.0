import { useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Download, Maximize2, Plus, Redo2, Undo2, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { useDiagramEditorStore } from '../../store/diagramEditorStore'

const BUTTON_CLASS =
  'rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600'

function CanvasToolbar({ title }) {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const past = useDiagramEditorStore((s) => s.past)
  const future = useDiagramEditorStore((s) => s.future)
  const undo = useDiagramEditorStore((s) => s.undo)
  const redo = useDiagramEditorStore((s) => s.redo)
  const addNode = useDiagramEditorStore((s) => s.addNode)
  const toGraph = useDiagramEditorStore((s) => s.toGraph)
  const loadGraph = useDiagramEditorStore((s) => s.loadGraph)
  const fileInputRef = useRef(null)

  function handleAddNode() {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    addNode(center)
  }

  function handleExport() {
    const graph = toGraph()
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'diagram').toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const graph = JSON.parse(await file.text())
      loadGraph(graph)
    } catch {
      // invalid file — silently ignore, nothing to recover
    }
    e.target.value = ''
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/80 p-1.5 shadow-glow backdrop-blur-md">
      <button type="button" className={BUTTON_CLASS} onClick={handleAddNode} aria-label="Add node" title="Add node">
        <Plus className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <button type="button" className={BUTTON_CLASS} onClick={() => zoomIn()} aria-label="Zoom in" title="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </button>
      <button type="button" className={BUTTON_CLASS} onClick={() => zoomOut()} aria-label="Zoom out" title="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        aria-label="Fit view"
        title="Fit view"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <button type="button" className={BUTTON_CLASS} onClick={undo} disabled={past.length === 0} aria-label="Undo" title="Undo (Ctrl+Z)">
        <Undo2 className="h-4 w-4" />
      </button>
      <button type="button" className={BUTTON_CLASS} onClick={redo} disabled={future.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
        <Redo2 className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <button type="button" className={BUTTON_CLASS} onClick={handleExport} aria-label="Export JSON" title="Export JSON">
        <Download className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Import JSON"
        title="Import JSON"
      >
        <Upload className="h-4 w-4" />
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
    </div>
  )
}

export default CanvasToolbar
