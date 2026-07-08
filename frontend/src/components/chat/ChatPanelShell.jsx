import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X } from 'lucide-react'
import AIAssistantMascot from '../illustrations/AIAssistantMascot'
import ChatBubble from './ChatBubble'
import TypingIndicator from './TypingIndicator'

function ChatPanelShell({
  title,
  open,
  onClose,
  messages,
  pending,
  question,
  onQuestionChange,
  onSubmit,
  emptyState,
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 right-0 z-20 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-slate-900">
              <AIAssistantMascot state="idle" className="h-7 w-7" />
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && emptyState}
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <ChatBubble key={i} role={m.role} text={m.text} isError={m.isError} />
              ))}
              {pending && messages[messages.length - 1]?.role === 'user' && <TypingIndicator />}
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="Ask a question…"
              disabled={pending}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !question.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default ChatPanelShell
