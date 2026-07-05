import { useState } from 'react'
import { Link } from 'react-router-dom'
import Lottie from './LottiePlayer'
import { Coins, Menu, MessageCircle, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import AccountMenu from './AccountMenu'
import Logo from './Logo'
import MobileNav from './MobileNav'
import streakFlameAnimation from '../assets/lottie/streak-flame.json'

function Topbar() {
  const { setChatOpen } = useUI()
  const { user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/60 bg-white/70 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="flex items-center gap-2 sm:hidden">
            <Logo className="h-7 w-7" />
            <span className="font-display text-sm font-semibold text-slate-800">Learnify AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 tabular-nums">
                <Lottie animationData={streakFlameAnimation} loop className="h-5 w-5" />
                {user.current_streak ?? 0}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-accent-400/15 px-3 py-1.5 text-xs font-semibold text-accent-600 tabular-nums">
                <Star className="h-4.5 w-4.5 fill-accent-400 text-accent-500" />
                {user.xp ?? 0} XP
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 tabular-nums">
                <Coins className="h-4.5 w-4.5 text-amber-500" />
                {user.gold ?? 0}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
            aria-label="Ask a doubt"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Ask a doubt</span>
          </button>
          <AccountMenu />
        </div>
      </header>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}

export default Topbar
