import { useMemo, useState } from "react"

import type {
  Course,
  Enrollment,
  EnrollmentPayment,
  Trainer,
  TrainerPayout,
} from "@/store/models"
import { useAppStore } from "@/store/useAppStore"
import { formatDate } from "@/utils/helpers"
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
import { TrainerPayoutForm } from "@/features/payouts/TrainerPayoutForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function monthKey(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

function enrollmentDue(e: Enrollment, coursePrice: number) {
  const paid = Number(e.amountPaid) || 0
  return Math.max(coursePrice - paid, 0)
}

function courseTrainerEarnedTotal(course: Course, enrollments: Enrollment[]) {
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

export function Finance() {
  const institutes = useAppStore((s) => s.institutes)
  const courses = useAppStore((s) => s.courses)
  const trainers = useAppStore((s) => s.trainers)
  const students = useAppStore((s) => s.students)
  const enrollments = useAppStore((s) => s.enrollments)
  const payments = useAppStore((s) => s.payments)
  const payouts = useAppStore((s) => s.payouts)
  const payoutCreate = useAppStore((s) => s.payoutCreate)
  const payoutRemove = useAppStore((s) => s.payoutRemove)

  const [payoutOpen, setPayoutOpen] = useState(false)
  const [trainerFilter, setTrainerFilter] = useState<string>("__all__")

  const courseEnrollments = useMemo(() => {
    const map = new Map<string, Enrollment[]>()
    for (const e of enrollments) {
      const list = map.get(e.courseId) ?? []
      list.push(e)
      map.set(e.courseId, list)
    }
    return map
  }, [enrollments])

  const courseById = useMemo(() => {
    const map = new Map<string, Course>()
    for (const c of courses) map.set(c.id, c)
    return map
  }, [courses])

  const enrollmentById = useMemo(() => {
    const map = new Map<string, Enrollment>()
    for (const e of enrollments) map.set(e.id, e)
    return map
  }, [enrollments])

  const trainerById = useMemo(() => {
    const map = new Map<string, Trainer>()
    for (const t of trainers) map.set(t.id, t)
    return map
  }, [trainers])

  const studentById = useMemo(() => {
    const map = new Map<string, { fullName: string }>()
    for (const s of students) map.set(s.id, { fullName: s.fullName })
    return map
  }, [students])

  const courseFinanceRows = useMemo(() => {
    return courses.map((c) => {
      const ens = courseEnrollments.get(c.id) ?? []
      const revenue = ens.reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0)
      const due = ens.reduce((sum, e) => sum + enrollmentDue(e, c.price), 0)
      const trainerEarned = courseTrainerEarnedTotal(c, ens)
      const profit = revenue - trainerEarned
      return { course: c, revenue, due, trainerEarned, profit }
    })
  }, [courseEnrollments, courses])

  const courseRevenueChart = useMemo(() => {
    return [...courseFinanceRows]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((r) => ({ name: r.course.title, revenue: r.revenue, profit: r.profit }))
  }, [courseFinanceRows])

  const trainerTotals = useMemo(() => {
    const earnedByTrainer = new Map<string, number>()
    for (const c of courses) {
      if (!c.trainerId) continue
      const earned = courseTrainerEarnedTotal(c, courseEnrollments.get(c.id) ?? [])
      earnedByTrainer.set(c.trainerId, (earnedByTrainer.get(c.trainerId) ?? 0) + earned)
    }
    const paidByTrainer = new Map<string, number>()
    for (const p of payouts) {
      paidByTrainer.set(p.trainerId, (paidByTrainer.get(p.trainerId) ?? 0) + (Number(p.amount) || 0))
    }

    return trainers.map((t) => {
      const earned = earnedByTrainer.get(t.id) ?? 0
      const paid = paidByTrainer.get(t.id) ?? 0
      return { trainer: t, earned, paid, remaining: earned - paid }
    })
  }, [courseEnrollments, courses, payouts, trainers])

  const trainerRemainingChart = useMemo(() => {
    return [...trainerTotals]
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 8)
      .map((t) => ({ name: t.trainer.fullName, remaining: t.remaining, earned: t.earned }))
  }, [trainerTotals])

  const selectedTrainer = useMemo(() => {
    if (trainerFilter === "__all__") return null
    return trainerById.get(trainerFilter) ?? null
  }, [trainerById, trainerFilter])

  const selectedTrainerCourses = useMemo(() => {
    if (!selectedTrainer) return []
    const list = courses.filter((c) => c.trainerId === selectedTrainer.id)
    return list.map((c) => {
      const ens = courseEnrollments.get(c.id) ?? []
      const earned = courseTrainerEarnedTotal(c, ens)
      const revenue = ens.reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0)
      return { course: c, revenue, earned }
    })
  }, [courseEnrollments, courses, selectedTrainer])

  const monthlyRows = useMemo(() => {
    const revenueByMonth = new Map<string, number>()
    const dueByMonth = new Map<string, number>()
    const trainerByMonth = new Map<string, number>()
    const fixedCounted = new Set<string>()

    for (const p of payments) {
      const e = enrollmentById.get(p.enrollmentId)
      if (!e) continue
      const c = courseById.get(e.courseId)
      if (!c) continue
      const m = monthKey((p as EnrollmentPayment).paidAt)
      const amount = Number((p as EnrollmentPayment).amount) || 0
      revenueByMonth.set(m, (revenueByMonth.get(m) ?? 0) + amount)
      if (c.trainerId && c.trainerCompType === "percent") {
        const pct = (Number(c.trainerCompValue) || 0) / 100
        trainerByMonth.set(m, (trainerByMonth.get(m) ?? 0) + amount * pct)
      }
    }

    for (const e of enrollments) {
      const c = courseById.get(e.courseId)
      if (!c) continue
      const m = monthKey(e.enrolledAt)
      dueByMonth.set(m, (dueByMonth.get(m) ?? 0) + enrollmentDue(e, c.price))
      if (c.trainerId && c.trainerCompType === "per_student" && e.status !== "cancelled") {
        trainerByMonth.set(
          m,
          (trainerByMonth.get(m) ?? 0) + (Number(c.trainerCompValue) || 0)
        )
      }
    }

    for (const c of courses) {
      if (!c.trainerId) continue
      if (c.trainerCompType !== "fixed") continue
      if (fixedCounted.has(c.id)) continue
      fixedCounted.add(c.id)
      const m = monthKey(c.startAt || c.createdAt)
      trainerByMonth.set(m, (trainerByMonth.get(m) ?? 0) + (Number(c.trainerCompValue) || 0))
    }

    const months = Array.from(
      new Set([...revenueByMonth.keys(), ...trainerByMonth.keys(), ...dueByMonth.keys()])
    ).sort()

    return months.map((m) => {
      const revenue = revenueByMonth.get(m) ?? 0
      const trainerCost = trainerByMonth.get(m) ?? 0
      const due = dueByMonth.get(m) ?? 0
      return { month: m, revenue, trainerCost, profit: revenue - trainerCost, due }
    })
  }, [courseById, courses, enrollmentById, enrollments, payments])

  const debtRows = useMemo(() => {
    const rows = []
    for (const e of enrollments) {
      const c = courseById.get(e.courseId)
      if (!c) continue
      const due = enrollmentDue(e, c.price)
      if (due <= 0) continue
      rows.push({
        enrollment: e,
        studentName: studentById.get(e.studentId)?.fullName ?? "غير موجود",
        courseTitle: c.title,
        price: c.price,
        due,
      })
    }
    return rows.sort((a, b) => b.due - a.due)
  }, [courseById, enrollments, studentById])

  const totalRevenue = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payments])

  const totalTrainerCost = useMemo(() => {
    return courses.reduce((sum, c) => {
      const ens = courseEnrollments.get(c.id) ?? []
      return sum + courseTrainerEarnedTotal(c, ens)
    }, 0)
  }, [courseEnrollments, courses])

  const totalDue = useMemo(() => {
    return enrollments.reduce((sum, e) => {
      const c = courseById.get(e.courseId)
      if (!c) return sum
      return sum + enrollmentDue(e, c.price)
    }, 0)
  }, [courseById, enrollments])

  const totalPaidToTrainers = useMemo(() => {
    return payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [payouts])

  const totalTrainerRemaining = useMemo(() => {
    const earned = trainerTotals.reduce((sum, t) => sum + t.earned, 0)
    const paid = trainerTotals.reduce((sum, t) => sum + t.paid, 0)
    return earned - paid
  }, [trainerTotals])

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي المدفوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">
              {totalRevenue.toLocaleString("ar")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي تكلفة المدربين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">
              {totalTrainerCost.toLocaleString("ar")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">الربح (تقريبي)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">
              {(totalRevenue - totalTrainerCost).toLocaleString("ar")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">الديون (على الطلاب)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totalDue.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">الدورات</TabsTrigger>
          <TabsTrigger value="trainers">المدربين</TabsTrigger>
          <TabsTrigger value="monthly">شهري</TabsTrigger>
          <TabsTrigger value="debts">ديون الطلاب</TabsTrigger>
          <TabsTrigger value="payouts">دفعات المدربين</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  مخطط أعلى الدورات (مدفوع/ربح)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courseRevenueChart}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => (Number(v) || 0).toLocaleString("ar")}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--chart-2)"
                      name="المدفوع"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="profit"
                      fill="var(--chart-1)"
                      name="الربح"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="rounded-xl border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الدورة</TableHead>
                  <TableHead>المعهد</TableHead>
                  <TableHead>المدرب</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>ديون</TableHead>
                  <TableHead>مستحق المدرب</TableHead>
                  <TableHead>الربح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseFinanceRows.map((r) => {
                  const institute = institutes.find((i) => i.id === r.course.instituteId)
                  const trainer = r.course.trainerId
                    ? trainerById.get(r.course.trainerId)
                    : null
                  return (
                    <TableRow key={r.course.id}>
                      <TableCell className="font-medium">{r.course.title}</TableCell>
                      <TableCell>{institute?.name ?? "-"}</TableCell>
                      <TableCell>{trainer?.fullName ?? "-"}</TableCell>
                      <TableCell>{r.revenue.toLocaleString("ar")}</TableCell>
                      <TableCell>{r.due.toLocaleString("ar")}</TableCell>
                      <TableCell>{r.trainerEarned.toLocaleString("ar")}</TableCell>
                      <TableCell>{r.profit.toLocaleString("ar")}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trainers">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">إجمالي المستحق للمدربين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium">
                    {trainerTotals.reduce((s, t) => s + t.earned, 0).toLocaleString("ar")}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">إجمالي المدفوع للمدربين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium">{totalPaidToTrainers.toLocaleString("ar")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">المتبقي للمدربين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium">{totalTrainerRemaining.toLocaleString("ar")}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">مخطط المتبقي للمدربين</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trainerRemainingChart}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => (Number(v) || 0).toLocaleString("ar")}
                    />
                    <Bar
                      dataKey="remaining"
                      fill="var(--chart-3)"
                      name="المتبقي"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المدرب</TableHead>
                    <TableHead>مستحق</TableHead>
                    <TableHead>مدفوع</TableHead>
                    <TableHead>متبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainerTotals.map((t) => (
                    <TableRow key={t.trainer.id}>
                      <TableCell className="font-medium">{t.trainer.fullName}</TableCell>
                      <TableCell>{t.earned.toLocaleString("ar")}</TableCell>
                      <TableCell>{t.paid.toLocaleString("ar")}</TableCell>
                      <TableCell>{t.remaining.toLocaleString("ar")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">تفاصيل مدرب</div>
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger className="w-full sm:w-96">
                  <SelectValue placeholder="اختر المدرب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">بدون اختيار</SelectItem>
                  {trainers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTrainer ? (
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الدورة</TableHead>
                      <TableHead>المدفوع</TableHead>
                      <TableHead>مستحق المدرب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTrainerCourses.map((r) => (
                      <TableRow key={r.course.id}>
                        <TableCell className="font-medium">{r.course.title}</TableCell>
                        <TableCell>{r.revenue.toLocaleString("ar")}</TableCell>
                        <TableCell>{r.earned.toLocaleString("ar")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
                اختر مدرب لعرض تفاصيله حسب الدورات.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">مخطط شهري</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRows}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => (Number(v) || 0).toLocaleString("ar")}
                      labelFormatter={(l) => `شهر: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={false}
                      name="المدفوع"
                    />
                    <Line
                      type="monotone"
                      dataKey="trainerCost"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      dot={false}
                      name="مستحق المدربين"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={false}
                      name="الربح"
                    />
                    <Line
                      type="monotone"
                      dataKey="due"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      dot={false}
                      name="الديون"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>مستحق المدربين</TableHead>
                    <TableHead>الربح</TableHead>
                    <TableHead>ديون</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRows.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month}</TableCell>
                      <TableCell>{m.revenue.toLocaleString("ar")}</TableCell>
                      <TableCell>{m.trainerCost.toLocaleString("ar")}</TableCell>
                      <TableCell>{m.profit.toLocaleString("ar")}</TableCell>
                      <TableCell>{m.due.toLocaleString("ar")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="debts">
          {debtRows.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              لا يوجد ديون حالياً.
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الدورة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtRows.map((r) => (
                    <TableRow key={r.enrollment.id}>
                      <TableCell className="font-medium">{r.studentName}</TableCell>
                      <TableCell>{r.courseTitle}</TableCell>
                      <TableCell>{r.price.toLocaleString("ar")}</TableCell>
                      <TableCell>{(Number(r.enrollment.amountPaid) || 0).toLocaleString("ar")}</TableCell>
                      <TableCell>{r.due.toLocaleString("ar")}</TableCell>
                      <TableCell>{formatDate(r.enrollment.enrolledAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-base font-medium">دفعات المدربين</div>
                <div className="text-sm text-muted-foreground">
                  سجل ما تم دفعه للمدربين لحساب المتبقي والمستحق
                </div>
              </div>
              <Button onClick={() => setPayoutOpen(true)} disabled={trainers.length === 0}>
                إضافة دفعة
              </Button>
            </div>

            <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة دفعة مدرب</DialogTitle>
                </DialogHeader>
                <TrainerPayoutForm
                  trainers={trainers}
                  courses={courses}
                  onSubmit={(values) => {
                    payoutCreate(values)
                    setPayoutOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>

            {payouts.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
                لا يوجد دفعات مسجلة بعد.
              </div>
            ) : (
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المدرب</TableHead>
                      <TableHead>الدورة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>ملاحظة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p: TrainerPayout) => {
                      const trainer = trainerById.get(p.trainerId)
                      const course = p.courseId ? courseById.get(p.courseId) : null
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{trainer?.fullName ?? "-"}</TableCell>
                          <TableCell>{course?.title ?? "عام"}</TableCell>
                          <TableCell>{(Number(p.amount) || 0).toLocaleString("ar")}</TableCell>
                          <TableCell>{formatDate(p.paidAt)}</TableCell>
                          <TableCell>{p.note || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="destructive" size="sm" onClick={() => payoutRemove(p.id)}>
                              حذف
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
