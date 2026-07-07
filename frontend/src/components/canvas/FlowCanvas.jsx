import { useEffect, useRef } from 'react'
import { Background, Controls, MiniMap, ReactFlow, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useDiagramEditorStore } from '../../store/diagramEditorStore'
import GenericNode from './GenericNode'
import { layoutGraph } from './layout'

const nodeTypes = { generic: GenericNode }

function FlowCanvas() {
  const nodes = useDiagramEditorStore((s) => s.nodes)
  const edges = useDiagramEditorStore((s) => s.edges)
  const onNodesChange = useDiagramEditorStore((s) => s.onNodesChange)
  const onEdgesChange = useDiagramEditorStore((s) => s.onEdgesChange)
  const onConnect = useDiagramEditorStore((s) => s.onConnect)
  const onNodeDragStart = useDiagramEditorStore((s) => s.onNodeDragStart)
  const setLayout = useDiagramEditorStore((s) => s.setLayout)
  const deleteSelected = useDiagramEditorStore((s) => s.deleteSelected)
  const undo = useDiagramEditorStore((s) => s.undo)
  const redo = useDiagramEditorStore((s) => s.redo)
  const graphVersion = useDiagramEditorStore((s) => s.graphVersion)
  const { fitView } = useReactFlow()
  const laidOutRef = useRef(false)

  // A fresh graph swap (initial load or an AI edit) bumps graphVersion in the
  // store — reset the latch so the layout effect below is allowed to run
  // again for the new graph instead of staying stuck from the first load.
  useEffect(() => {
    laidOutRef.current = false
  }, [graphVersion])

  // Runs ELK layout once per freshly loaded/AI-edited graph — detected by
  // every node still sitting at the (0,0) origin the store seeds new nodes
  // with. Manual drags move nodes off-origin, so this never re-runs and
  // clobbers a user's manual layout.
  useEffect(() => {
    if (nodes.length === 0) return
    const allUnpositioned = nodes.every((n) => n.position.x === 0 && n.position.y === 0)
    if (!allUnpositioned) {
      laidOutRef.current = true
      return
    }
    if (laidOutRef.current) return
    laidOutRef.current = true
    layoutGraph(nodes, edges).then((positions) => {
      setLayout(positions)
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }))
    })
  }, [nodes, edges, setLayout, fitView, graphVersion])

  function handleKeyDown(e) {
    const meta = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()
    if (meta && key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if (meta && (key === 'y' || (key === 'z' && e.shiftKey))) {
      e.preventDefault()
      redo()
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement === e.currentTarget) {
      deleteSelected()
    }
  }

  return (
    <div className="relative h-full w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!bg-white/80" />
      </ReactFlow>
    </div>
  )
}

export default FlowCanvas
