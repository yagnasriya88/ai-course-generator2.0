import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, LayoutDashboard, ListChecks, PlusCircle, Shapes, Workflow, X } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/create', label: 'New Course', icon: PlusCircle },
  { to: '/jobs', label: 'Generation Jobs', icon: ListChecks },
  { to: '/canvas', label: 'Generate Diagrams', icon: Workflow },
  { to: '/diagrams', label: 'My Diagrams', icon: Shapes },
]

function MobileNav({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-slate-900/30 sm:hidden"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl sm:hidden"
          >
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-sm font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileNav
