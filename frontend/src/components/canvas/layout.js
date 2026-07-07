import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

const NODE_WIDTH = 180
const NODE_HEIGHT = 64

const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '60',
  'elk.layered.spacing.nodeNodeBetweenLayers': '90',
}

/** Runs ELK.js's layered layout over the current graph and returns a map of
 * node id -> {x, y}. Positions are computed client-side and merged into the
 * Zustand store; the AI never produces coordinates itself (Rendering
 * Architecture: AI owns graph content, the frontend owns layout). */
export async function layoutGraph(nodes, edges) {
  const graph = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: nodes.map((n) => ({ id: n.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  }
  const layouted = await elk.layout(graph)
  const positions = {}
  for (const child of layouted.children || []) {
    positions[child.id] = { x: child.x, y: child.y }
  }
  return positions
}
