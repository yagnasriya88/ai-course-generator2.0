import { useState } from 'react'
import { Send } from 'lucide-react'
import AIAssistantMascot from '../illustrations/AIAssistantMascot'
import { useDiagramEditorStore } from '../../store/diagramEditorStore'
import { aiEditDiagram } from '../../utils/api'

/** Persistent bottom bar for natural-language diagram edits. Submits the
 * instruction to the backend (which only ever returns graph JSON — see
 * routes/diagrams.py's ai-edit endpoint) and merges the result into the
 * Zustand store; this component never touches rendering itself. */
function AIPromptBar({ diagramId }) {
  const [instruction, setInstruction] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const applyGraph = useDiagramEditorStore((s) => s.applyGraph)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!instruction.trim() || pending) return
    setPending(true)
    setError(null)
    try {
      const canvas = await aiEditDiagram(diagramId, instruction.trim())
      applyGraph(canvas)
      setInstruction('')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md">
      {error && <p className="mb-2 text-xs text-danger-600">{error}</p>}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <AIAssistantMascot state={pending ? 'thinking' : 'idle'} className="h-8 w-8 shrink-0" />
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Describe how you'd like to modify this diagram…"
          disabled={pending}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !instruction.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? 'Thinking…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default AIPromptBar
