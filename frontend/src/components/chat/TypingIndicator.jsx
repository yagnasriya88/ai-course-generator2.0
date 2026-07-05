import AIAssistantMascot from '../illustrations/AIAssistantMascot'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
      <AIAssistantMascot state="thinking" className="h-6 w-6" />
      <span className="text-sm text-slate-400">Thinking…</span>
    </div>
  )
}

export default TypingIndicator
