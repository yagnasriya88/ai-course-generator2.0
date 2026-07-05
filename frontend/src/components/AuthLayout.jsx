import { motion } from 'framer-motion'
import { ListChecks, Sparkles, TrendingUp, Video } from 'lucide-react'
import { fadeInUp, staggerContainer } from '../utils/motion'
import StudyingIllustration from './illustrations/StudyingIllustration'
import Logo from './Logo'
import PageBackground from './PageBackground'

const DEFAULT_FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-generated courses',
    description: 'Describe any topic and a crew of AI agents builds a full course for you.',
  },
  {
    icon: Video,
    title: 'Videos, notes & an AI tutor',
    description: 'Every lesson pairs embedded videos and rich notes with an on-demand AI tutor.',
  },
  {
    icon: ListChecks,
    title: 'Module quizzes that matter',
    description: 'Each module wraps up with a quiz — pass it to unlock real progress.',
  },
  {
    icon: TrendingUp,
    title: 'Progress you can see',
    description: 'Track lesson and quiz completion across every course, at a glance.',
  },
]

function BrandMark({ className = 'h-10 w-10' }) {
  return <Logo className={className} />
}

function AuthLayout({ heading, subheading, children, features = DEFAULT_FEATURES }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 px-12 py-14 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)',
          }}
        />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="relative flex items-center gap-3"
        >
          <BrandMark />
          <span className="font-display text-lg font-bold">Learnify AI</span>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="relative">
          <div className="flex justify-center">
            <StudyingIllustration className="h-40 w-40" />
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight">
            Learn anything, one AI-built course at a time.
          </h2>
          <p className="mt-3 max-w-sm text-primary-100">
            Turn a single prompt into a structured course with lessons, videos, an AI tutor, and
            quizzes that track your real progress.
          </p>

          <motion.ul
            className="mt-10 flex flex-col gap-5"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {features.map(({ icon: Icon, title, description }) => (
              <motion.li key={title} variants={fadeInUp} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-primary-100">{description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <p className="relative text-xs text-primary-200">
          Your generated courses are private to your account.
        </p>
      </div>

      <PageBackground className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
        <motion.div
          className="mx-auto flex w-full max-w-sm flex-col rounded-3xl border border-white/60 bg-white/70 p-8 backdrop-blur-md shadow-glow"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-center lg:hidden">
            <BrandMark />
          </div>
          <h1 className="mt-4 text-center font-display text-2xl font-bold text-slate-900 lg:text-left">
            {heading}
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500 lg:text-left">{subheading}</p>

          {children}
        </motion.div>
      </PageBackground>
    </div>
  )
}

export default AuthLayout
