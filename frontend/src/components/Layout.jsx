import { Outlet } from "react-router-dom"
import { UIProvider } from "../context/UIContext"
import { JobsProvider } from "../context/JobsContext"
import { DiagramJobsProvider } from "../context/DiagramJobsContext"
import DiagramJobNotificationToast from "./DiagramJobNotificationToast"
import GlobalChatPanel from "./GlobalChatPanel"
import JobNotificationToast from "./JobNotificationToast"
import StreakMilestoneToast from "./StreakMilestoneToast"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

function Layout() {
  return (
    <UIProvider>
      <JobsProvider>
        <DiagramJobsProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-y-auto">
                <Outlet />
              </main>
            </div>
          </div>
          <GlobalChatPanel />
          <StreakMilestoneToast />
          <JobNotificationToast />
          <DiagramJobNotificationToast />
        </DiagramJobsProvider>
      </JobsProvider>
    </UIProvider>
  )
}

export default Layout
