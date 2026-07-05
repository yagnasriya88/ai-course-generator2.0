import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { askGeneralChat } from '../utils/api'
import { useUI } from '../context/UIContext'
import ChatPanelShell from './chat/ChatPanelShell'

const EXAMPLE_PROMPTS = ['Explain recursion simply', "What's a REST API?", 'Tips to study faster']

function GlobalChatPanel() {
  const { chatOpen, setChatOpen } = useUI()
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    const q = question.trim()
    if (!q || pending) return
    setQuestion('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setPending(true)
    try {
      const { answer } = await askGeneralChat(q)
      setMessages((m) => [...m, { role: 'assistant', text: answer }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Sorry — ${err.message}`, isError: true },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <ChatPanelShell
      title="Ask a doubt"
      open={chatOpen}
      onClose={() => setChatOpen(false)}
      messages={messages}
      pending={pending}
      question={question}
      onQuestionChange={setQuestion}
      onSubmit={handleSend}
      emptyState={
        <div className="flex flex-col items-center gap-4 pt-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-slate-800">
              Hey, I'm your Learnify AI assistant
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Stuck on something? Ask me anything, anytime.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      }
    />
  )
}

export default GlobalChatPanel
