function ChatBubble({ role, text, isError }) {
  return (
    <div
      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
        role === 'user'
          ? 'ml-auto bg-primary-600 text-white'
          : isError
            ? 'bg-danger-500/10 text-danger-600'
            : 'bg-slate-100 text-slate-700'
      }`}
    >
      {text}
    </div>
  )
}

export default ChatBubble
