import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false
let renderCounter = 0

function MermaidDiagram({ code, onError }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
      })
      initialized = true
    }
    let cancelled = false
    // A fresh id per render call, not a stable useId() — mermaid.render() creates a
    // temporary DOM node keyed by this id, and React StrictMode's dev-mode double-invoke
    // of effects means a stable id causes two concurrent calls to collide on the same node.
    const renderId = `mermaid-${++renderCounter}`
    mermaid
      .render(renderId, code)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          onError?.()
        }
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
