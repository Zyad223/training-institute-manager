import { useMemo, useState } from "react"
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Link } from "react-router-dom"

import type { Enrollment } from "@/store/models"
import { useEnrollments } from "@/hooks/useEnrollments"
import { EnrollmentForm } from "@/features/enrollments/EnrollmentForm"
import { downloadCsv, formatDate } from "@/utils/helpers"
import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function statusLabel(status: Enrollment["status"]) {
  if (status === "enrolled") return "مسجل"
  if (status === "completed") return "مكتمل"
  return "ملغي"
}

export function Enrollments() {
  const {
    enrollments,
    students,
    courses,
    enrollmentCreate,
    enrollmentRemove,
    enrollmentUpdate,
  } = useEnrollments()
  const paymentCreate = useAppStore((s) => s.paymentCreate)

  const canCreate = students.length > 0 && courses.length > 0

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "__all__" | Enrollment["status"]
  >("__all__")
  const [studentFilter, setStudentFilter] = useState<string>("__all__")
  const [courseFilter, setCourseFilter] = useState<string>("__all__")
  const [monthFilter, setMonthFilter] = useState<string>("")

  const editing = useMemo<Enrollment | undefined>(() => {
    if (!editingId) return undefined
    return enrollments.find((x) => x.id === editingId)
  }, [editingId, enrollments])

  const studentOptions = useMemo<ComboboxOption[]>(() => {
    return [
      { value: "__all__", label: "كل الطلاب" },
      ...students
        .map((s) => ({
          value: s.id,
          label: s.fullName,
          keywords: [s.fullName, s.phone, s.email].filter(Boolean),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "ar")),
    ]
  }, [students])

  const courseOptions = useMemo<ComboboxOption[]>(() => {
    return [
      { value: "__all__", label: "كل الدورات" },
      ...courses
        .map((c) => ({
          value: c.id,
          label: c.title,
          keywords: [c.title, c.description].filter(Boolean),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "ar")),
    ]
  }, [courses])

  const studentById = useMemo(() => {
    const map = new Map<string, { fullName: string; phone: string; email: string }>()
    for (const s of students) map.set(s.id, { fullName: s.fullName, phone: s.phone, email: s.email })
    return map
  }, [students])

  const courseById = useMemo(() => {
    const map = new Map<string, { title: string; price: number }>()
    for (const c of courses) map.set(c.id, { title: c.title, price: c.price })
    return map
  }, [courses])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enrollments
      .filter((e) => {
        if (statusFilter !== "__all__" && e.status !== statusFilter) return false
        if (studentFilter !== "__all__" && e.studentId !== studentFilter) return false
        if (courseFilter !== "__all__" && e.courseId !== courseFilter) return false
        if (monthFilter) {
          const d = new Date(e.enrolledAt)
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, "0")
          if (`${y}-${m}` !== monthFilter) return false
        }
        if (!q) return true
        const student = studentById.get(e.studentId)
        const course = courseById.get(e.courseId)
        const hay = `${student?.fullName ?? ""} ${student?.phone ?? ""} ${student?.email ?? ""} ${
          course?.title ?? ""
        }`
          .toLowerCase()
          .trim()
        return hay.includes(q)
      })
      .map((e) => {
        const student = studentById.get(e.studentId)
        const course = courseById.get(e.courseId)
        const price = course?.price ?? 0
        const paid = Number(e.amountPaid) || 0
        const due = Math.max(price - paid, 0)
        return {
          enrollment: e,
          studentName: student?.fullName ?? "غير موجود",
          studentPhone: student?.phone ?? "",
          courseTitle: course?.title ?? "غير موجود",
          price,
          paid,
          due,
        }
      })
      .sort((a, b) => new Date(b.enrollment.enrolledAt).getTime() - new Date(a.enrollment.enrolledAt).getTime())
  }, [courseById, courseFilter, enrollments, monthFilter, query, statusFilter, studentById, studentFilter])

  const debtCount = useMemo(() => filteredRows.filter((r) => r.due > 0).length, [filteredRows])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-medium">التسجيلات</div>
          <div className="text-sm text-muted-foreground">
            تسجيل الطلاب في الدورات
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={filteredRows.length === 0}
            onClick={() => {
              const now = new Date()
              const yyyy = now.getFullYear()
              const mm = String(now.getMonth() + 1).padStart(2, "0")
              downloadCsv(
                `enrollments-${yyyy}-${mm}.csv`,
                ["الطالب", "هاتف", "الدورة", "تاريخ التسجيل", "الحالة", "السعر", "المدفوع", "المتبقي"],
                filteredRows.map((r) => [
                  r.studentName,
                  r.studentPhone,
                  r.courseTitle,
                  formatDate(r.enrollment.enrolledAt),
                  statusLabel(r.enrollment.status),
                  r.price,
                  r.paid,
                  r.due,
                ])
              )
            }}
          >
            تصدير CSV
          </Button>
          <Button
            variant="outline"
            disabled={debtCount === 0}
            onClick={() => {
              const now = new Date()
              const yyyy = now.getFullYear()
              const mm = String(now.getMonth() + 1).padStart(2, "0")
              const debts = filteredRows.filter((r) => r.due > 0)
              downloadCsv(
                `debts-${yyyy}-${mm}.csv`,
                ["الطالب", "هاتف", "الدورة", "تاريخ التسجيل", "السعر", "المدفوع", "المتبقي"],
                debts.map((r) => [
                  r.studentName,
                  r.studentPhone,
                  r.courseTitle,
                  formatDate(r.enrollment.enrolledAt),
                  r.price,
                  r.paid,
                  r.due,
                ])
              )
            }}
          >
            تصدير الديون
          </Button>
          <Button
            onClick={() => {
              setEditingId(null)
              setOpen(true)
            }}
            disabled={!canCreate}
          >
            <PlusIcon className="size-4" />
            تسجيل جديد
          </Button>
        </div>
      </div>

      {canCreate && (
        <div className="grid gap-2 rounded-xl border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث: اسم/هاتف/إيميل/اسم دورة..."
              className="h-9 w-full sm:w-96"
            />
            <div className="text-sm text-muted-foreground">
              النتائج: {filteredRows.length.toLocaleString("ar")} / {enrollments.length.toLocaleString("ar")}
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <Combobox
              value={studentFilter}
              options={studentOptions}
              onValueChange={setStudentFilter}
              placeholder="الطالب"
              searchPlaceholder="ابحث عن طالب..."
            />
            <Combobox
              value={courseFilter}
              options={courseOptions}
              onValueChange={setCourseFilter}
              placeholder="الدورة"
              searchPlaceholder="ابحث عن دورة..."
            />
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-9"
            />
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList className="w-full">
                <TabsTrigger value="__all__" className="flex-1">
                  الكل
                </TabsTrigger>
                <TabsTrigger value="enrolled" className="flex-1">
                  مسجل
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">
                  مكتمل
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex-1">
                  ملغي
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل تسجيل" : "تسجيل جديد"}</DialogTitle>
          </DialogHeader>
          <EnrollmentForm
            students={students}
            courses={courses}
            initial={editing}
            enrollmentId={editing?.id}
            submitLabel={editing ? "تحديث" : "إنشاء"}
            onSubmit={(values, firstPayment) => {
              if (editing) {
                enrollmentUpdate(editing.id, { ...values, amountPaid: editing.amountPaid })
              } else {
                const created = enrollmentCreate({ ...values, amountPaid: 0 })
                if (firstPayment && (Number(firstPayment.amount) || 0) > 0) {
                  paymentCreate({
                    enrollmentId: created.id,
                    amount: Number(firstPayment.amount) || 0,
                    method: firstPayment.method,
                    paidAt: firstPayment.paidAt,
                    note: firstPayment.note,
                    receiptNo: firstPayment.receiptNo,
                  })
                }
              }
              setOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {!canCreate ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لإضافة تسجيلات، تأكد من إضافة طلاب ودورات أولاً.
        </div>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا يوجد تسجيلات بعد. اضغط “تسجيل جديد”.
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا توجد نتائج مطابقة للبحث/الفلاتر.
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>الدورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r) => {
                const e = r.enrollment
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                        <Button asChild variant="link" className="h-auto p-0">
                          <Link to={`/students/${e.studentId}`}>{r.studentName}</Link>
                        </Button>
                    </TableCell>
                    <TableCell>{r.courseTitle}</TableCell>
                    <TableCell>{formatDate(e.enrolledAt)}</TableCell>
                    <TableCell>{r.paid.toLocaleString("ar")}</TableCell>
                    <TableCell>{r.due.toLocaleString("ar")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.status === "enrolled"
                            ? "default"
                            : e.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {statusLabel(e.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            setEditingId(e.id)
                            setOpen(true)
                          }}
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => enrollmentRemove(e.id)}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
