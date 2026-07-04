import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogOut, Menu } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import MobileNav from "./MobileNav"

function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
              T
            </span>
            <span className="font-display text-sm font-semibold text-slate-800">
              Text-to-Learn
            </span>
          </Link>
        </div>
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md p-1.5 text-slate-400 hover:bg-danger-500/10 hover:text-danger-600"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </header>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

export default Topbar
