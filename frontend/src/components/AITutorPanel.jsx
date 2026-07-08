import { useState } from 'react'
import { askTutorStream } from '../utils/api'
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

    await askTutorStream(lessonId, q, {
      onDelta: (delta) => {
        setMessages((m) => {
          const last = m[m.length - 1]
          if (last?.role === 'tutor' && last?.streaming) {
            return [...m.slice(0, -1), { ...last, text: last.text + delta }]
          }
          return [...m, { role: 'tutor', text: delta, streaming: true }]
        })
      },
      onDone: () => {
        setMessages((m) => {
          const last = m[m.length - 1]
          if (last?.role !== 'tutor') return m
          return [...m.slice(0, -1), { ...last, streaming: false }]
        })
        setPending(false)
      },
      onError: (message) => {
        setMessages((m) => {
          const last = m[m.length - 1]
          const errorMsg = { role: 'tutor', text: `Sorry — ${message}`, isError: true, streaming: false }
          if (last?.role === 'tutor' && last?.streaming) return [...m.slice(0, -1), errorMsg]
          return [...m, errorMsg]
        })
        setPending(false)
      },
    })
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
