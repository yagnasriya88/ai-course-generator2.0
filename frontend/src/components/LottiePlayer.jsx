import { useReducedMotion } from 'framer-motion'
import LottieImport from 'lottie-react'

// Vite's dev pre-bundle sometimes wraps lottie-react's UMD build, which makes the
// default import resolve to the whole `{ default, LottiePlayer, useLottie, ... }`
// exports object instead of the component itself — unwrap once if that happens so
// every consumer gets a real component either way.
const RawLottie = typeof LottieImport === 'function' ? LottieImport : LottieImport.default

// Every current consumer (Topbar's streak flame, RewardPopup's confetti,
// StreakMilestoneToast's flame, QuizPanel's success check) just renders
// `<Lottie animationData={...} loop={...} />` with no autoplay opt-out —
// defaulting autoplay to `!reducedMotion` here means all of them respect the
// OS/browser reduced-motion preference without touching each call site, and
// any future Lottie usage gets the same behavior automatically.
function Lottie({ autoplay, loop, ...props }) {
  const reduce = useReducedMotion()
  return <RawLottie {...props} autoplay={autoplay ?? !reduce} loop={Boolean(loop) && !reduce} />
}

export default Lottie
