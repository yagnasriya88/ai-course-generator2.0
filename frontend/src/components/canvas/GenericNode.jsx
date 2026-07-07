import { Handle, Position } from '@xyflow/react'
import { coverGradient } from '../../utils/coverGradient'

/** The ONLY node renderer for every Knowledge Canvas diagram type — styling is
 * driven entirely by data (`group` picks an accent color), never by
 * `diagram_type`. Adding a new diagram type never touches this component;
 * only backend/app/agents/diagram_types.py + frontend diagramTypes.js need
 * an entry (Rendering Architecture: renderer stays generic/data-driven). */
function GenericNode({ data, selected }) {
  const gradient = data.group ? coverGradient(data.group) : 'from-primary-500 to-primary-700'

  return (
    <div
      className={`min-w-[140px] max-w-[220px] overflow-hidden rounded-2xl border bg-white/90 shadow-glow backdrop-blur-md transition ${
        selected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-white/60'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-primary-400" />
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <div className="px-3 py-2">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{data.label}</p>
        {data.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-primary-400" />
    </div>
  )
}

export default GenericNode
