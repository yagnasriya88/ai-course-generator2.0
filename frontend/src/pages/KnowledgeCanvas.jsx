import { motion } from 'framer-motion'
import DiagramTypeCard from '../components/DiagramTypeCard'
import PageBackground from '../components/PageBackground'
import { DIAGRAM_TYPES } from '../data/diagramTypes'
import { usePageMotion } from '../utils/motion'

function KnowledgeCanvas() {
  const { fadeInUp, staggerContainer } = usePageMotion()

  return (
    <PageBackground tone="accent" className="min-h-full">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center">
          <span className="mb-4 inline-block rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            AI-powered diagramming
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Knowledge <span className="text-primary-600">Canvas</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-500">
            Pick a diagram type and describe a topic — a crew of AI agents will lay it out on an
            infinite canvas you can keep editing.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {DIAGRAM_TYPES.map((type) => (
            <DiagramTypeCard key={type.key} type={type} />
          ))}
        </motion.div>
      </div>
    </PageBackground>
  )
}

export default KnowledgeCanvas
