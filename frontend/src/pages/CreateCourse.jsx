import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PromptForm from '../components/PromptForm'
import PageBackground from '../components/PageBackground'
import { fadeInUp } from '../utils/motion'

function CreateCourse() {
  const navigate = useNavigate()

  return (
    <PageBackground tone="accent">
      <motion.div
        className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <span className="mb-4 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          AI-powered course builder
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Learnify <span className="text-primary-600">AI</span>
        </h1>
        <p className="mt-3 max-w-md text-slate-500">
          Describe a topic. A crew of AI agents builds you a full course.
        </p>

        <div className="mt-10 w-full rounded-2xl border border-white/60 bg-white/70 p-6 shadow-glow backdrop-blur-md">
          <PromptForm onGenerated={(course) => navigate(`/course/${course._id}`)} />
        </div>
      </motion.div>
    </PageBackground>
  )
}

export default CreateCourse
