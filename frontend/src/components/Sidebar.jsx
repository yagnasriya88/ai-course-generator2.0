import { Link, NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, LogOut, PlusCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const navItems = [
  { to: "/", label: "New Course", icon: PlusCircle, end: true },
  { to: "/courses", label: "Dashboard", icon: LayoutDashboard },
]

function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 sm:flex">
      <Link to="/" className="flex items-center gap-2 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-glow">
          T
        </span>
        <span className="font-display text-lg font-semibold text-slate-900">Text-to-Learn</span>
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4">
        {user && (
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-700" title={user.email}>
                {user.name}
              </div>
              <div className="truncate text-xs text-slate-400" title={user.email}>
                {user.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-danger-500/10 hover:text-danger-600"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-1 text-xs text-slate-400">Powered by Gemini &amp; CrewAI</div>
      </div>
    </aside>
  )
}

export default Sidebar
