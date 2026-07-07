import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

// Tuned for chat-bubble contexts: tight vertical rhythm (last-child margins
// zeroed) rather than prose's article-style spacing, and colors mapped onto
// the app's slate/primary tokens instead of a generic typography theme.
const COMPONENTS = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <h1 className="mt-3 mb-2 font-display text-base font-bold text-slate-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1.5 font-display text-sm font-bold text-slate-900 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2 mb-1 font-display text-sm font-semibold text-slate-900 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => <ul className="mb-2 list-outside list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-outside list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary-300 pl-3 text-slate-500 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    // rehype-highlight only tags fenced code blocks with a `language-*`
    // className; inline `code` never gets one, so this is the reliable signal.
    const isBlock = /language-/.test(className || '')
    if (!isBlock) {
      return (
        <code className="rounded-md bg-slate-900/8 px-1.5 py-0.5 font-mono text-[0.85em] text-primary-700">
          {children}
        </code>
      )
    }
    return <code className={className}>{children}</code>
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[0.85em] leading-relaxed text-slate-100 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-[0.9em]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-slate-300">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1 font-semibold text-slate-900">{children}</th>,
  td: ({ children }) => <td className="px-2 py-1 align-top">{children}</td>,
  tr: ({ children }) => <tr className="border-b border-slate-200 last:border-0">{children}</tr>,
  hr: () => <hr className="my-3 border-slate-200" />,
}

function Markdown({ content, className = '' }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
