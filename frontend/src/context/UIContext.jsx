import { createContext, useContext, useEffect, useState } from 'react'

const UIContext = createContext(null)
const SIDEBAR_COLLAPSED_KEY = 'ttl_sidebar_collapsed'

export function UIProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  )
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  return (
    <UIContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed, chatOpen, setChatOpen }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within a UIProvider')
  return ctx
}

// Course/lesson pages get their own persistent CourseSidebar, so the global app
// Sidebar collapses to icon-only while they're mounted, restoring on unmount —
// this preserves global "New Course"/"Dashboard" access without competing for width.
export function useForceSidebarCollapsed() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUI()
  useEffect(() => {
    const previous = sidebarCollapsed
    setSidebarCollapsed(true)
    return () => setSidebarCollapsed(previous)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
