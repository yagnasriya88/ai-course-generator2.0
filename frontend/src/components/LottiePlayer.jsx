import LottieImport from 'lottie-react'

// Vite's dev pre-bundle sometimes wraps lottie-react's UMD build, which makes the
// default import resolve to the whole `{ default, LottiePlayer, useLottie, ... }`
// exports object instead of the component itself — unwrap once if that happens so
// every consumer gets a real component either way.
const Lottie = typeof LottieImport === 'function' ? LottieImport : LottieImport.default

export default Lottie
