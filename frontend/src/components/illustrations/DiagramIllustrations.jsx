// Icon-in-halo scenes for each Knowledge Canvas diagram type — mirrors
// ModuleIllustrations.jsx's Halo convention so the gallery cards feel native
// to the rest of the app instead of a bolted-on feature.

function Halo({ color, children }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="46" fill={color} />
      {children}
    </svg>
  )
}

export function MindMapIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#dbeafe">
        <circle cx="50" cy="50" r="8" fill="#2563eb" />
        <line x1="50" y1="50" x2="30" y2="34" stroke="#60a5fa" strokeWidth="2.5" />
        <line x1="50" y1="50" x2="70" y2="34" stroke="#60a5fa" strokeWidth="2.5" />
        <line x1="50" y1="50" x2="30" y2="66" stroke="#60a5fa" strokeWidth="2.5" />
        <line x1="50" y1="50" x2="70" y2="66" stroke="#60a5fa" strokeWidth="2.5" />
        <circle cx="30" cy="34" r="5" fill="#3b82f6" />
        <circle cx="70" cy="34" r="5" fill="#3b82f6" />
        <circle cx="30" cy="66" r="5" fill="#3b82f6" />
        <circle cx="70" cy="66" r="5" fill="#3b82f6" />
      </Halo>
    </div>
  )
}

export function FlowchartIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#dcfce7">
        <rect x="38" y="26" width="24" height="14" rx="3" fill="#16a34a" />
        <line x1="50" y1="40" x2="50" y2="48" stroke="#16a34a" strokeWidth="2.5" />
        <path d="M50 48l8 10-8 10-8-10z" fill="#22c55e" />
        <line x1="50" y1="68" x2="50" y2="74" stroke="#16a34a" strokeWidth="2.5" />
        <rect x="38" y="74" width="24" height="12" rx="3" fill="#16a34a" />
      </Halo>
    </div>
  )
}

export function RoadmapIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#fef3c7">
        <line x1="26" y1="66" x2="74" y2="34" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        <circle cx="26" cy="66" r="6" fill="#f59e0b" />
        <circle cx="50" cy="50" r="6" fill="#fbbf24" />
        <circle cx="74" cy="34" r="6" fill="#f59e0b" />
      </Halo>
    </div>
  )
}

export function ConceptMapIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#e0f2fe">
        <line x1="34" y1="34" x2="66" y2="34" stroke="#0284c7" strokeWidth="2.5" />
        <line x1="34" y1="34" x2="34" y2="66" stroke="#0284c7" strokeWidth="2.5" />
        <line x1="66" y1="34" x2="66" y2="66" stroke="#0284c7" strokeWidth="2.5" />
        <line x1="34" y1="66" x2="66" y2="66" stroke="#0284c7" strokeWidth="2.5" />
        <line x1="34" y1="34" x2="66" y2="66" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="34" cy="34" r="6" fill="#0369a1" />
        <circle cx="66" cy="34" r="6" fill="#0369a1" />
        <circle cx="34" cy="66" r="6" fill="#0369a1" />
        <circle cx="66" cy="66" r="6" fill="#0369a1" />
      </Halo>
    </div>
  )
}

export function ProcessDiagramIllustration({ className = 'h-10 w-10' }) {
  return (
    <div className={className}>
      <Halo color="#fde7ee">
        <rect x="24" y="44" width="16" height="16" rx="3" fill="#ec4899" />
        <rect x="42" y="44" width="16" height="16" rx="3" fill="#f472b6" />
        <rect x="60" y="44" width="16" height="16" rx="3" fill="#ec4899" />
        <line x1="40" y1="52" x2="42" y2="52" stroke="#be185d" strokeWidth="2.5" />
        <line x1="58" y1="52" x2="60" y2="52" stroke="#be185d" strokeWidth="2.5" />
      </Halo>
    </div>
  )
}

export const DIAGRAM_ILLUSTRATIONS = {
  mindmap: MindMapIllustration,
  flowchart: FlowchartIllustration,
  roadmap: RoadmapIllustration,
  concept_map: ConceptMapIllustration,
  process_diagram: ProcessDiagramIllustration,
}
