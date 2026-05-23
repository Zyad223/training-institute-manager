import { Outlet } from "react-router-dom"

import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-screen-2xl grid-cols-1 md:grid-cols-[16rem_1fr]">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex min-w-0 flex-col">
          <Topbar />
          <main className="min-w-0 flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

