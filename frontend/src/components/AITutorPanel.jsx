import { useState } from 'react'
import { askTutor } from '../utils/api'
import ChatPanelShell from './chat/ChatPanelShell'

function AITutorPanel({ lessonId, open, onClose }) {
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
      const { answer } = await askTutor(lessonId, q)
      setMessages((m) => [...m, { role: 'tutor', text: answer }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'tutor', text: `Sorry — ${err.message}`, isError: true }])
    } finally {
      setPending(false)
    }
  }

  return (
    <ChatPanelShell
      title="AI Tutor"
      open={open}
      onClose={onClose}
      messages={messages}
      pending={pending}
      question={question}
      onQuestionChange={setQuestion}
      onSubmit={handleSend}
      emptyState={
        <div className="flex flex-col items-center gap-3 pt-6 text-center">
          <p className="text-sm text-slate-400">
            Ask anything about this lesson — I'll answer grounded in what you're reading.
          </p>
        </div>
      }
    />
  )
}

export default AITutorPanel
