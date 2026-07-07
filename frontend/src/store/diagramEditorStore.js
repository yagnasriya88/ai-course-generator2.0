import { create } from 'zustand'
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react'

const MAX_HISTORY = 50

function toFlowNodes(nodes = []) {
  return nodes.map((n) => ({
    id: n.id,
    type: 'generic',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: { label: n.label, group: n.group, description: n.description },
  }))
}

function toFlowEdges(edges = []) {
  return edges.map((e, i) => ({
    id: `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
    label: e.label || undefined,
  }))
}

function pushHistory(state) {
  return { past: [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-MAX_HISTORY), future: [] }
}

/** Zustand store backing the React Flow editor — the single source of truth
 * for the current graph, undo/redo history, and dirty state driving
 * DiagramEditor's autosave. History snapshots are taken BEFORE a mutation
 * (drag start / remove / connect / programmatic edit), never after, so undo
 * restores the true prior state instead of a mid-drag frame. */
export const useDiagramEditorStore = create((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  dirty: false,
  graphVersion: 0,

  loadGraph(graph) {
    set((state) => ({
      nodes: toFlowNodes(graph.nodes),
      edges: toFlowEdges(graph.edges),
      past: [],
      future: [],
      dirty: false,
      graphVersion: state.graphVersion + 1,
    }))
  },

  applyGraph(graph) {
    set((state) => ({
      ...pushHistory(state),
      nodes: toFlowNodes(graph.nodes),
      edges: toFlowEdges(graph.edges),
      dirty: true,
      graphVersion: state.graphVersion + 1,
    }))
  },

  setLayout(positions) {
    set((state) => ({
      nodes: state.nodes.map((n) => (positions[n.id] ? { ...n, position: positions[n.id] } : n)),
    }))
  },

  onNodeDragStart() {
    set((state) => pushHistory(state))
  },

  onNodesChange(changes) {
    set((state) => {
      const historyPatch = changes.some((c) => c.type === 'remove') ? pushHistory(state) : {}
      return { ...historyPatch, nodes: applyNodeChanges(changes, state.nodes), dirty: true }
    })
  },

  onEdgesChange(changes) {
    set((state) => {
      const historyPatch = changes.some((c) => c.type === 'remove') ? pushHistory(state) : {}
      return { ...historyPatch, edges: applyEdgeChanges(changes, state.edges), dirty: true }
    })
  },

  onConnect(connection) {
    set((state) => ({ ...pushHistory(state), edges: addEdge(connection, state.edges), dirty: true }))
  },

  addNode(position) {
    set((state) => ({
      ...pushHistory(state),
      nodes: [
        ...state.nodes,
        { id: `n${Date.now()}`, type: 'generic', position, data: { label: 'New node' } },
      ],
      dirty: true,
    }))
  },

  updateNodeLabel(id, label) {
    set((state) => ({
      ...pushHistory(state),
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
      dirty: true,
    }))
  },

  deleteSelected() {
    set((state) => {
      const hasSelection = state.nodes.some((n) => n.selected) || state.edges.some((e) => e.selected)
      if (!hasSelection) return state
      return {
        ...pushHistory(state),
        nodes: state.nodes.filter((n) => !n.selected),
        edges: state.edges.filter((e) => !e.selected),
        dirty: true,
      }
    })
  },

  undo() {
    set((state) => {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        past: state.past.slice(0, -1),
        future: [...state.future, { nodes: state.nodes, edges: state.edges }],
        dirty: true,
      }
    })
  },

  redo() {
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[state.future.length - 1]
      return {
        nodes: next.nodes,
        edges: next.edges,
        future: state.future.slice(0, -1),
        past: [...state.past, { nodes: state.nodes, edges: state.edges }],
        dirty: true,
      }
    })
  },

  markSaved() {
    set({ dirty: false })
  },

  toGraph() {
    const { nodes, edges } = get()
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.data.label,
        group: n.data.group ?? null,
        description: n.data.description ?? null,
        x: n.position.x,
        y: n.position.y,
      })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label ?? null })),
    }
  },
}))
