import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PromptForm from '../components/PromptForm'
import { fadeInUp } from '../utils/motion'

function Home() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Text-to-<span className="text-primary-600">Learn</span>
      </h1>
      <p className="mt-3 max-w-md text-slate-500">
        Describe a topic. A crew of AI agents builds you a full course.
      </p>

      <div className="mt-10 w-full">
        <PromptForm onGenerated={(course) => navigate(`/course/${course._id}`)} />
      </div>
    </motion.div>
  )
}

export default Home
