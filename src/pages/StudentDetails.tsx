import { useMemo } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { ArrowRightIcon } from "lucide-react"

import type { EnrollmentPayment } from "@/store/models"
import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { downloadCsv, formatDate, formatDateTime } from "@/utils/helpers"

function statusLabel(status: "enrolled" | "completed" | "cancelled") {
  if (status === "enrolled") return "مسجل"
  if (status === "completed") return "مكتمل"
  return "ملغي"
}

export function StudentDetails() {
  const params = useParams()
  const id = params.id ?? ""

  const students = useAppStore((s) => s.students)
  const courses = useAppStore((s) => s.courses)
  const enrollments = useAppStore((s) => s.enrollments)
  const payments = useAppStore((s) => s.payments)

  const student = useMemo(() => students.find((s) => s.id === id), [id, students])

  const courseById = useMemo(() => {
    const map = new Map<string, { title: string; price: number }>()
    for (const c of courses) map.set(c.id, { title: c.title, price: c.price })
    return map
  }, [courses])

  const studentEnrollments = useMemo(() => {
    return enrollments
      .filter((e) => e.studentId === id)
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
  }, [enrollments, id])

  const enrollmentIds = useMemo(() => new Set(studentEnrollments.map((e) => e.id)), [studentEnrollments])

  const paymentRows = useMemo(() => {
    return payments
      .filter((p) => enrollmentIds.has(p.enrollmentId))
      .map((p) => {
        const e = studentEnrollments.find((x) => x.id === p.enrollmentId)
        const course = e ? courseById.get(e.courseId) : null
        return {
          payment: p as EnrollmentPayment,
          courseTitle: course?.title ?? "غير موجود",
          status: e?.status ?? "enrolled",
        }
      })
      .sort((a, b) => new Date(b.payment.paidAt).getTime() - new Date(a.payment.paidAt).getTime())
  }, [courseById, enrollmentIds, payments, studentEnrollments])

  const enrollmentRows = useMemo(() => {
    return studentEnrollments.map((e) => {
      const course = courseById.get(e.courseId)
      const price = course?.price ?? 0
      const paid = Number(e.amountPaid) || 0
      const due = Math.max(price - paid, 0)
      return {
        enrollment: e,
        courseTitle: course?.title ?? "غير موجود",
        price,
        paid,
        due,
      }
    })
  }, [courseById, studentEnrollments])

  const totals = useMemo(() => {
    const paid = paymentRows.reduce((sum, r) => sum + (Number(r.payment.amount) || 0), 0)
    const due = enrollmentRows.reduce((sum, r) => sum + r.due, 0)
    return {
      enrollments: enrollmentRows.length,
      paid,
      due,
    }
  }, [enrollmentRows, paymentRows])

  if (!id) return <Navigate to="/students" replace />
  if (!student) return <Navigate to="/students" replace />

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-medium">تفاصيل الطالب</div>
          <div className="text-sm text-muted-foreground">
            {student.fullName} • {student.phone || "-"} • {student.email || "-"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              downloadCsv(
                `student-${student.fullName}-enrollments.csv`,
                ["الدورة", "تاريخ التسجيل", "الحالة", "السعر", "المدفوع", "المتبقي"],
                enrollmentRows.map((r) => [
                  r.courseTitle,
                  formatDate(r.enrollment.enrolledAt),
                  statusLabel(r.enrollment.status),
                  r.price,
                  r.paid,
                  r.due,
                ])
              )
            }}
            disabled={enrollmentRows.length === 0}
          >
            تصدير التسجيلات
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadCsv(
                `student-${student.fullName}-payments.csv`,
                ["رقم الإيصال", "الدورة", "التاريخ", "الطريقة", "المبلغ", "ملاحظة"],
                paymentRows.map((r) => [
                  r.payment.receiptNo,
                  r.courseTitle,
                  formatDateTime(r.payment.paidAt),
                  r.payment.method,
                  r.payment.amount,
                  r.payment.note,
                ])
              )
            }}
            disabled={paymentRows.length === 0}
          >
            تصدير الدفعات
          </Button>
          <Button asChild variant="outline">
            <Link to="/students">
              <ArrowRightIcon className="size-4" />
              رجوع
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">عدد التسجيلات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totals.enrollments.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي المدفوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totals.paid.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي الديون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{totals.due.toLocaleString("ar")}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="enrollments">
        <TabsList>
          <TabsTrigger value="enrollments">التسجيلات</TabsTrigger>
          <TabsTrigger value="payments">الدفعات</TabsTrigger>
          <TabsTrigger value="debts">الديون</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          {enrollmentRows.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              لا يوجد تسجيلات لهذا الطالب.
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الدورة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentRows.map((r) => (
                    <TableRow key={r.enrollment.id}>
                      <TableCell className="font-medium">{r.courseTitle}</TableCell>
                      <TableCell>{formatDate(r.enrollment.enrolledAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.enrollment.status === "enrolled"
                              ? "default"
                              : r.enrollment.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {statusLabel(r.enrollment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.price.toLocaleString("ar")}</TableCell>
                      <TableCell>{r.paid.toLocaleString("ar")}</TableCell>
                      <TableCell>{r.due.toLocaleString("ar")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments">
          {paymentRows.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              لا يوجد دفعات لهذا الطالب.
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الإيصال</TableHead>
                    <TableHead>الدورة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>ملاحظة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRows.map((r) => (
                    <TableRow key={r.payment.id}>
                      <TableCell className="font-medium">{r.payment.receiptNo}</TableCell>
                      <TableCell>{r.courseTitle}</TableCell>
                      <TableCell>{formatDateTime(r.payment.paidAt)}</TableCell>
                      <TableCell>{r.payment.method}</TableCell>
                      <TableCell>{Number(r.payment.amount || 0).toLocaleString("ar")}</TableCell>
                      <TableCell>{r.payment.note || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="debts">
          {enrollmentRows.filter((r) => r.due > 0).length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              لا يوجد ديون على هذا الطالب.
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الدورة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentRows
                    .filter((r) => r.due > 0)
                    .map((r) => (
                      <TableRow key={r.enrollment.id}>
                        <TableCell className="font-medium">{r.courseTitle}</TableCell>
                        <TableCell>{r.price.toLocaleString("ar")}</TableCell>
                        <TableCell>{r.paid.toLocaleString("ar")}</TableCell>
                        <TableCell>{r.due.toLocaleString("ar")}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

