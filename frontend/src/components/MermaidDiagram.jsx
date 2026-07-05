import { useEffect, useRef, useState } from 'react'

let initialized = false
let renderCounter = 0

function MermaidDiagram({ code, onError }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // Dynamically imported, not a top-level `import mermaid from 'mermaid'` — mermaid
    // drags in d3/dagre/katex (~1.3MB) that only matters for lessons that actually
    // contain a diagram, so lessons without visual aids never fetch it at all.
    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return
      if (!initialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          suppressErrorRendering: true,
        })
        initialized = true
      }
      // A fresh id per render call, not a stable useId() — mermaid.render() creates a
      // temporary DOM node keyed by this id, and React StrictMode's dev-mode double-invoke
      // of effects means a stable id causes two concurrent calls to collide on the same node.
      const renderId = `mermaid-${++renderCounter}`
      mermaid
        .render(renderId, code, containerRef.current)
        .then(({ svg }) => {
          if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message)
            onError?.()
          }
        })
    })
    return () => {
      cancelled = true
    }
  }, [code])

  // A malformed diagram shouldn't break the rest of the lesson — fail silently.
  if (error) return null

  return <div ref={containerRef} className="flex justify-center overflow-x-auto" />
}

export default MermaidDiagram
