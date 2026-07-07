import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Download,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Shapes,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { exportMyData } from '../utils/api'
import Logo from './Logo'

const NAV_GROUPS = [
  {
    label: 'Learn',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/courses', label: 'Courses', icon: BookOpen },
    ],
  },
  {
    label: 'Create',
    items: [{ to: '/create', label: 'New Course', icon: PlusCircle }],
  },
  {
    label: 'Canvas',
    items: [
      { to: '/canvas', label: 'Generate Diagrams', icon: Workflow },
      { to: '/diagrams', label: 'My Diagrams', icon: Shapes },
    ],
  },
]

function NavItem({ to, label, icon: Icon, end, collapsed }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors duration-150 ${
            collapsed ? 'justify-center px-0' : 'px-3'
          } ${isActive ? 'text-primary-700' : 'text-slate-500 hover:text-slate-900'}`
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 via-primary-500/15 to-primary-500/5 shadow-glow ring-1 ring-primary-500/25"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            ) : (
              <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-150 group-hover:bg-white/70" />
            )}
            <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="relative z-10 truncate">{label}</span>}
          </>
        )}
      </NavLink>

      {collapsed && (
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -4, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

function SidebarProfile({ collapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  if (!user) return null

  const xp = user.xp ?? 0
  const xpToNext = user.xp_to_next ?? 500
  const progressPct = xp + xpToNext > 0 ? Math.min(100, Math.round((xp / (xp + xpToNext)) * 100)) : 0

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `learnify-ai-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // non-critical — leave menu open on failure
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`absolute bottom-full z-50 mb-2 w-52 overflow-hidden rounded-xl border border-white/60 bg-white/90 py-1 shadow-xl backdrop-blur-xl ${
                collapsed ? 'left-0' : 'left-0 right-0'
              }`}
            >
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting…' : 'Export my data'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-500/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-xl border border-white/60 bg-white/60 p-2.5 text-left shadow-sm transition hover:bg-white/90 ${
          collapsed ? 'justify-center' : ''
        }`}
        aria-label="Account menu"
      >
        <span className="relative shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#9333ea] to-[#2563eb] text-sm font-semibold text-white">
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-accent-400 text-[10px] font-bold text-white">
            {user.level ?? 1}
          </span>
        </span>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800" title={user.email}>
              {user.name}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9333ea] to-[#2563eb]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {xp} XP · {xpToNext} to level {(user.level ?? 1) + 1}
            </p>
          </div>
        )}
      </button>
    </div>
  )
}

function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUI()
  const reduceMotion = useReducedMotion()

  return (
    <aside
      className={`relative z-20 hidden shrink-0 flex-col overflow-hidden border-r border-white/60 bg-white/70 py-5 backdrop-blur-xl transition-[width] duration-200 sm:flex ${
        sidebarCollapsed ? 'w-20 px-3' : 'w-72 px-4'
      }`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-16 -z-10 h-56 w-56 rounded-full bg-primary-300/25 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, 10, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -right-20 -z-10 h-56 w-56 rounded-full bg-accent-400/15 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -10, 0], y: [0, -12, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className={`flex items-center px-1 ${sidebarCollapsed ? 'flex-col gap-3' : 'justify-between'}`}>
        <Link to="/" className={`flex items-center gap-2.5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <Logo className="h-8 w-8 shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden font-display text-lg font-semibold whitespace-nowrap text-slate-900"
              >
                Learnify AI
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      <LayoutGroup>
        <nav className="mt-5 flex flex-1 flex-col gap-6 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavItem key={item.to} {...item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </LayoutGroup>

      {!sidebarCollapsed && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-primary-50/70 px-3 py-2 text-[11px] text-primary-700">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Powered by Gemini &amp; CrewAI
        </div>
      )}

      <SidebarProfile collapsed={sidebarCollapsed} />
    </aside>
  )
}

export default Sidebar
