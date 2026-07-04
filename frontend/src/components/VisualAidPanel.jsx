import { useState } from 'react'
import { Workflow } from 'lucide-react'
import MermaidDiagram from './MermaidDiagram'

function VisualAidPanel({ aids }) {
  const [failed, setFailed] = useState(() => new Set())

  if (!aids || aids.length === 0) return null
  const visibleAids = aids.filter((_, i) => !failed.has(i))
  if (visibleAids.length === 0) return null

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
        <Workflow className="h-4 w-4 text-primary-600" />
        Visual aids
      </h2>
      <div className="mt-4 flex flex-col gap-6">
        {aids.map(
          (aid, i) =>
            !failed.has(i) && (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">{aid.title}</p>
                <div className="mt-3">
                  <MermaidDiagram
                    code={aid.data.mermaid}
                    onError={() => setFailed((prev) => new Set(prev).add(i))}
                  />
                </div>
              </div>
            ),
        )}
      </div>
    </section>
  )
}

export default VisualAidPanel
