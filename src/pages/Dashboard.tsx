import { useMemo } from "react"
import type { ReactNode } from "react"
import { BookOpen, Building2, ClipboardList, GraduationCap, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useAppStore } from "@/store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function monthKey(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

function courseTrainerEarnedTotal(
  course: { trainerId: string | null; trainerCompType: string; trainerCompValue: number },
  enrollments: Array<{ amountPaid: number; status: string }>
) {
  if (!course.trainerId) return 0
  if (course.trainerCompType === "fixed") return Number(course.trainerCompValue) || 0
  if (course.trainerCompType === "per_student") {
    const count = enrollments.filter((e) => e.status !== "cancelled").length
    return count * (Number(course.trainerCompValue) || 0)
  }
  const pct = (Number(course.trainerCompValue) || 0) / 100
  const revenue = enrollments.reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0)
  return revenue * pct
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-medium">{value.toLocaleString("ar")}</div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const institutes = useAppStore((s) => s.institutes)
  const courses = useAppStore((s) => s.courses)
  const trainers = useAppStore((s) => s.trainers)
  const students = useAppStore((s) => s.students)
  const enrollments = useAppStore((s) => s.enrollments)

  const courseById = useMemo(() => {
    const map = new Map<string, (typeof courses)[number]>()
    for (const c of courses) map.set(c.id, c)
    return map
  }, [courses])

  const totals = useMemo(() => {
    const revenue = enrollments.reduce(
      (sum, e) => sum + (Number(e.amountPaid) || 0),
      0
    )
    const due = enrollments.reduce((sum, e) => {
      const c = courseById.get(e.courseId)
      if (!c) return sum
      return sum + Math.max((c.price ?? 0) - (Number(e.amountPaid) || 0), 0)
    }, 0)

    const enrollmentsByCourse = new Map<string, typeof enrollments>()
    for (const e of enrollments) {
      const list = enrollmentsByCourse.get(e.courseId) ?? []
      list.push(e)
      enrollmentsByCourse.set(e.courseId, list)
    }

    const trainerCost = courses.reduce((sum, c) => {
      return (
        sum +
        courseTrainerEarnedTotal(
          c,
          (enrollmentsByCourse.get(c.id) ?? []).map((e) => ({
            amountPaid: Number(e.amountPaid) || 0,
            status: e.status,
          }))
        )
      )
    }, 0)

    return { revenue, due, profit: revenue - trainerCost }
  }, [courseById, courses, enrollments])

  const monthly = useMemo(() => {
    const byMonth = new Map<string, { revenue: number; due: number }>()
    for (const e of enrollments) {
      const c = courseById.get(e.courseId)
      if (!c) continue
      const m = monthKey(e.enrolledAt)
      const current = byMonth.get(m) ?? { revenue: 0, due: 0 }
      const paid = Number(e.amountPaid) || 0
      current.revenue += paid
      current.due += Math.max((c.price ?? 0) - paid, 0)
      byMonth.set(m, current)
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({ month: m, revenue: v.revenue, due: v.due }))
  }, [courseById, enrollments])

  const topCourses = useMemo(() => {
    const revenueByCourse = new Map<string, number>()
    for (const e of enrollments) {
      revenueByCourse.set(
        e.courseId,
        (revenueByCourse.get(e.courseId) ?? 0) + (Number(e.amountPaid) || 0)
      )
    }
    return courses
      .map((c) => ({ name: c.title, revenue: revenueByCourse.get(c.id) ?? 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
  }, [courses, enrollments])

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="المعاهد"
          value={institutes.length}
          icon={<Building2 className="size-4" />}
        />
        <StatCard
          title="الدورات"
          value={courses.length}
          icon={<BookOpen className="size-4" />}
        />
        <StatCard
          title="المدربين"
          value={trainers.length}
          icon={<Users className="size-4" />}
        />
        <StatCard
          title="الطلاب"
          value={students.length}
          icon={<GraduationCap className="size-4" />}
        />
        <StatCard
          title="التسجيلات"
          value={enrollments.length}
          icon={<ClipboardList className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي المدفوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totals.revenue.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">الربح (تقريبي)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totals.profit.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ديون الطلاب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totals.due.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المدفوع والديون شهرياً</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => (Number(v) || 0).toLocaleString("ar")}
                  labelFormatter={(l) => `شهر: ${l}`}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="المدفوع" />
                <Line type="monotone" dataKey="due" stroke="var(--chart-3)" strokeWidth={2} dot={false} name="الديون" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أعلى الدورات دخلاً</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCourses} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => (Number(v) || 0).toLocaleString("ar")} />
                <Bar dataKey="revenue" fill="var(--chart-2)" name="المدفوع" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">البداية السريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <div>1) أضف معهد</div>
          <div>2) أضف دورة مرتبطة بمعهد</div>
          <div>3) أضف طلاب</div>
          <div>4) أنشئ تسجيل طالب في دورة</div>
        </CardContent>
      </Card>
    </div>
  )
}
