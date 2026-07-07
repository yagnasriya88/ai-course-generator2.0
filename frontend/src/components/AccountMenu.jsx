import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { exportMyData } from '../utils/api'

function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!user) return null

  async function handleLogout() {
    setOpen(false)
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 hover:bg-primary-200"
        aria-label="Account menu"
      >
        {user.name?.[0]?.toUpperCase() ?? 'U'}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="truncate text-sm font-medium text-slate-800" title={user.email}>
                  {user.name}
                </div>
                <div className="truncate text-xs text-slate-400" title={user.email}>
                  {user.email}
                </div>
              </div>
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
    </div>
  )
}

export default AccountMenu
