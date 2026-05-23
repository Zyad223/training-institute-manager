import { Suspense, lazy } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { MainLayout } from "@/components/layout/MainLayout"

const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard }))
)
const Institutes = lazy(() =>
  import("@/pages/Institutes").then((m) => ({ default: m.Institutes }))
)
const Courses = lazy(() =>
  import("@/pages/Courses").then((m) => ({ default: m.Courses }))
)
const Trainers = lazy(() =>
  import("@/pages/Trainers").then((m) => ({ default: m.Trainers }))
)
const Students = lazy(() =>
  import("@/pages/Students").then((m) => ({ default: m.Students }))
)
const StudentDetails = lazy(() =>
  import("@/pages/StudentDetails").then((m) => ({ default: m.StudentDetails }))
)
const Enrollments = lazy(() =>
  import("@/pages/Enrollments").then((m) => ({ default: m.Enrollments }))
)
const Finance = lazy(() =>
  import("@/pages/Finance").then((m) => ({ default: m.Finance }))
)

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="p-6 text-sm text-muted-foreground">جاري التحميل...</div>
        }
      >
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/institutes" element={<Institutes />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/enrollments" element={<Enrollments />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
