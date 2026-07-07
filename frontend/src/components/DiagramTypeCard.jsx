import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeInUp } from '../utils/motion'
import { DIAGRAM_ILLUSTRATIONS } from './illustrations/DiagramIllustrations'

function DiagramTypeCard({ type }) {
  const Icon = type.icon
  const Illustration = DIAGRAM_ILLUSTRATIONS[type.key]

  return (
    <motion.div variants={fadeInUp}>
      <Link
        to={`/canvas/${type.key}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-glow transition hover:-translate-y-0.5 hover:shadow-glow"
      >
        <div
          className={`relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br ${type.gradient}`}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1.5px,transparent_1.5px)] [background-size:16px_16px]"
          />
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 p-2.5 shadow-sm transition duration-200 group-hover:scale-105">
            {Illustration ? <Illustration className="h-full w-full" /> : <Icon className="h-8 w-8 text-slate-700" />}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-primary-600" />
            <h3 className="line-clamp-1 font-display text-base font-semibold text-slate-900">
              {type.name}
            </h3>
          </div>
          <p className="line-clamp-2 text-sm text-slate-500">{type.description}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export default DiagramTypeCard
