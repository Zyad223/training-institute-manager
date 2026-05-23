import { useMemo, useState } from "react"

import type { Course, Enrollment, EnrollmentPayment, Student } from "@/store/models"
import {
  ENROLLMENT_STATUS,
  PAYMENT_METHODS,
  type EnrollmentStatus,
  type PaymentMethod,
} from "@/utils/constants"
import { useAppStore } from "@/store/useAppStore"
import { formatDate, genReceiptNo } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type EnrollmentSubmitValues = Pick<Enrollment, "studentId" | "courseId" | "status">

type FirstPaymentDraft = {
  amount: number
  method: PaymentMethod
  paidAt: string
  receiptNo: string
  note: string
}

function toDateInputValue(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function methodLabel(m: PaymentMethod) {
  if (m === "cash") return "كاش"
  if (m === "card") return "بطاقة"
  if (m === "transfer") return "تحويل"
  return "أخرى"
}

export function EnrollmentForm({
  students,
  courses,
  initial,
  enrollmentId,
  onSubmit,
  submitLabel = "حفظ",
}: {
  students: Student[]
  courses: Course[]
  initial?: Partial<Enrollment>
  enrollmentId?: string
  onSubmit: (values: EnrollmentSubmitValues, firstPayment?: FirstPaymentDraft) => void
  submitLabel?: string
}) {
  const defaults = useMemo<EnrollmentSubmitValues>(
    () => ({
      studentId: initial?.studentId ?? (students[0]?.id ?? ""),
      courseId: initial?.courseId ?? (courses[0]?.id ?? ""),
      status: initial?.status ?? "enrolled",
    }),
    [initial, students, courses]
  )

  const [values, setValues] = useState<EnrollmentSubmitValues>(defaults)
  const isEdit = Boolean(enrollmentId)

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === values.courseId)
  }, [courses, values.courseId])
  const coursePrice = selectedCourse?.price ?? 0

  const allEnrollments = useAppStore((s) => s.enrollments)
  const allPayments = useAppStore((s) => s.payments)
  const paymentCreate = useAppStore((s) => s.paymentCreate)
  const paymentRemove = useAppStore((s) => s.paymentRemove)

  const currentEnrollment = useMemo(() => {
    return enrollmentId ? allEnrollments.find((e) => e.id === enrollmentId) : undefined
  }, [allEnrollments, enrollmentId])
  const amountPaid = Number(currentEnrollment?.amountPaid ?? initial?.amountPaid ?? 0) || 0
  const amountDue = Math.max(coursePrice - amountPaid, 0)

  const payments = useMemo(() => {
    return enrollmentId ? allPayments.filter((p) => p.enrollmentId === enrollmentId) : []
  }, [allPayments, enrollmentId])

  const studentOptions = useMemo<ComboboxOption[]>(() => {
    return students.map((s) => ({
      value: s.id,
      label: s.fullName,
      keywords: [s.fullName, s.phone || "", s.email || ""].filter(Boolean),
    }))
  }, [students])

  const courseOptions = useMemo<ComboboxOption[]>(() => {
    return courses.map((c) => ({
      value: c.id,
      label: c.title,
      keywords: [c.title, c.description || ""].filter(Boolean),
    }))
  }, [courses])

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === values.studentId)
  }, [students, values.studentId])

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentDraft, setPaymentDraft] = useState<FirstPaymentDraft>(() => ({
    amount: 0,
    method: "cash",
    paidAt: new Date().toISOString(),
    receiptNo: genReceiptNo(),
    note: "",
  }))

  const [firstPayment, setFirstPayment] = useState<FirstPaymentDraft>(() => ({
    amount: 0,
    method: "cash",
    paidAt: new Date().toISOString(),
    receiptNo: genReceiptNo(),
    note: "",
  }))

  function printReceipt(payment: EnrollmentPayment) {
    const studentName = selectedStudent?.fullName ?? "غير موجود"
    const courseTitle = selectedCourse?.title ?? "غير موجود"
    const instituteName = selectedCourse
      ? (useAppStore.getState().institutes.find((i) => i.id === selectedCourse.instituteId)?.name ?? "-")
      : "-"
    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>إيصال ${payment.receiptNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          .wrap { max-width: 520px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
          h1 { font-size: 18px; margin: 0 0 12px; }
          .row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid #eee; }
          .row:last-child { border-bottom: 0; }
          .k { color: #666; }
          .v { font-weight: 600; }
          .muted { color: #666; font-size: 12px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>إيصال دفع</h1>
          <div class="row"><div class="k">رقم الإيصال</div><div class="v">${payment.receiptNo}</div></div>
          <div class="row"><div class="k">التاريخ</div><div class="v">${formatDate(payment.paidAt)}</div></div>
          <div class="row"><div class="k">المعهد</div><div class="v">${instituteName}</div></div>
          <div class="row"><div class="k">الدورة</div><div class="v">${courseTitle}</div></div>
          <div class="row"><div class="k">الطالب</div><div class="v">${studentName}</div></div>
          <div class="row"><div class="k">طريقة الدفع</div><div class="v">${methodLabel(payment.method)}</div></div>
          <div class="row"><div class="k">المبلغ</div><div class="v">${Number(payment.amount || 0).toLocaleString("ar")}</div></div>
          <div class="muted">${payment.note ? `ملاحظة: ${payment.note}` : ""}</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `
    const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900")
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!values.studentId || !values.courseId) return
        if (!isEdit && (Number(firstPayment.amount) || 0) > 0) {
          onSubmit(values, firstPayment)
        } else {
          onSubmit(values)
        }
      }}
    >
      <div className="grid gap-2">
        <Label>الطالب</Label>
        <Combobox
          value={values.studentId}
          options={studentOptions}
          onValueChange={(v) => setValues({ ...values, studentId: v })}
          placeholder={students.length ? "اختر الطالب" : "أضف طلاب أولاً"}
          searchPlaceholder="ابحث بالاسم أو الهاتف أو البريد..."
          disabled={students.length === 0}
        />
      </div>

      <div className="grid gap-2">
        <Label>الدورة</Label>
        <Combobox
          value={values.courseId}
          options={courseOptions}
          onValueChange={(v) => setValues({ ...values, courseId: v })}
          placeholder={courses.length ? "اختر الدورة" : "أضف دورات أولاً"}
          searchPlaceholder="ابحث باسم الدورة أو الوصف..."
          disabled={courses.length === 0}
        />
      </div>

      <div className="rounded-xl border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="text-muted-foreground">السعر:</span>{" "}
            <span className="font-medium">{coursePrice.toLocaleString("ar")}</span>{" "}
            <span className="text-muted-foreground">• المدفوع:</span>{" "}
            <span className="font-medium">{amountPaid.toLocaleString("ar")}</span>{" "}
            <span className="text-muted-foreground">• المتبقي:</span>{" "}
            <span className="font-medium">{amountDue.toLocaleString("ar")}</span>
          </div>
          {isEdit && (
            <Button type="button" variant="outline" onClick={() => {
              setPaymentDraft({
                amount: 0,
                method: "cash",
                paidAt: new Date().toISOString(),
                receiptNo: genReceiptNo(),
                note: "",
              })
              setPaymentOpen(true)
            }}>
              إضافة دفعة
            </Button>
          )}
        </div>

        {!isEdit ? (
          <div className="mt-3 grid gap-3">
            <div className="text-sm text-muted-foreground">دفعة أولى (اختياري)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first-pay-amount">المبلغ</Label>
                <Input
                  id="first-pay-amount"
                  type="number"
                  min={0}
                  value={firstPayment.amount}
                  onChange={(e) =>
                    setFirstPayment({ ...firstPayment, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={firstPayment.method}
                  onValueChange={(v) =>
                    setFirstPayment({ ...firstPayment, method: v as PaymentMethod })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الطريقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {methodLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first-pay-date">تاريخ الدفع</Label>
                <Input
                  id="first-pay-date"
                  type="date"
                  value={toDateInputValue(firstPayment.paidAt)}
                  onChange={(e) => {
                    const iso = new Date(`${e.target.value}T12:00:00`).toISOString()
                    setFirstPayment({ ...firstPayment, paidAt: iso })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="first-pay-receipt">رقم الإيصال</Label>
                <Input
                  id="first-pay-receipt"
                  value={firstPayment.receiptNo}
                  onChange={(e) =>
                    setFirstPayment({ ...firstPayment, receiptNo: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="first-pay-note">ملاحظة</Label>
              <Input
                id="first-pay-note"
                value={firstPayment.note}
                onChange={(e) => setFirstPayment({ ...firstPayment, note: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            {payments.length === 0 ? (
              <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                لا يوجد دفعات مسجلة بعد.
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الإيصال</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الطريقة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>ملاحظة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .slice()
                      .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
                      .map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.receiptNo}</TableCell>
                          <TableCell>{formatDate(p.paidAt)}</TableCell>
                          <TableCell>{methodLabel(p.method)}</TableCell>
                          <TableCell>{(Number(p.amount) || 0).toLocaleString("ar")}</TableCell>
                          <TableCell>{p.note || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button type="button" variant="outline" size="sm" onClick={() => printReceipt(p)}>
                                طباعة
                              </Button>
                              <Button type="button" variant="destructive" size="sm" onClick={() => paymentRemove(p.id)}>
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label>الحالة</Label>
        <Select
          value={values.status}
          onValueChange={(v) =>
            setValues({ ...values, status: v as EnrollmentStatus })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            {ENROLLMENT_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "enrolled"
                  ? "مسجل"
                  : s === "completed"
                    ? "مكتمل"
                    : "ملغي"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="submit"
          disabled={!values.studentId || !values.courseId}
        >
          {submitLabel}
        </Button>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة دفعة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pay-amount">المبلغ</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                value={paymentDraft.amount}
                onChange={(e) =>
                  setPaymentDraft({ ...paymentDraft, amount: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={paymentDraft.method}
                onValueChange={(v) =>
                  setPaymentDraft({ ...paymentDraft, method: v as PaymentMethod })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {methodLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pay-date">تاريخ الدفع</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={toDateInputValue(paymentDraft.paidAt)}
                  onChange={(e) => {
                    const iso = new Date(`${e.target.value}T12:00:00`).toISOString()
                    setPaymentDraft({ ...paymentDraft, paidAt: iso })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pay-receipt">رقم الإيصال</Label>
                <Input
                  id="pay-receipt"
                  value={paymentDraft.receiptNo}
                  onChange={(e) =>
                    setPaymentDraft({ ...paymentDraft, receiptNo: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pay-note">ملاحظة</Label>
              <Input
                id="pay-note"
                value={paymentDraft.note}
                onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (!enrollmentId) return
                  if ((Number(paymentDraft.amount) || 0) <= 0) return
                  paymentCreate({
                    enrollmentId,
                    amount: Number(paymentDraft.amount) || 0,
                    method: paymentDraft.method,
                    paidAt: paymentDraft.paidAt,
                    note: paymentDraft.note,
                    receiptNo: paymentDraft.receiptNo,
                  })
                  setPaymentOpen(false)
                }}
              >
                حفظ الدفعة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}

