import { useMemo, useState } from "react"

import type { Course, Trainer, TrainerPayout } from "@/store/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PayoutFormValues = Omit<TrainerPayout, "id">

function toDateInputValue(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function TrainerPayoutForm({
  trainers,
  courses,
  initial,
  onSubmit,
  submitLabel = "إضافة دفعة",
}: {
  trainers: Trainer[]
  courses: Course[]
  initial?: Partial<PayoutFormValues>
  onSubmit: (values: PayoutFormValues) => void
  submitLabel?: string
}) {
  const defaults = useMemo<PayoutFormValues>(
    () => ({
      trainerId: initial?.trainerId ?? (trainers[0]?.id ?? ""),
      courseId: initial?.courseId ?? null,
      amount: initial?.amount ?? 0,
      paidAt: initial?.paidAt ?? new Date().toISOString(),
      note: initial?.note ?? "",
    }),
    [initial, trainers]
  )

  const [values, setValues] = useState<PayoutFormValues>(defaults)
  const courseValue = values.courseId ?? "__general__"

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!values.trainerId) return
        onSubmit({
          ...values,
          amount: Number(values.amount) || 0,
          note: values.note || "",
        })
      }}
    >
      <div className="grid gap-2">
        <Label>المدرب</Label>
        <Select
          value={values.trainerId}
          onValueChange={(v) => setValues({ ...values, trainerId: v })}
          disabled={trainers.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر المدرب" />
          </SelectTrigger>
          <SelectContent>
            {trainers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>الدورة (اختياري)</Label>
        <Select
          value={courseValue}
          onValueChange={(v) =>
            setValues({ ...values, courseId: v === "__general__" ? null : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الدورة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__general__">عام / بدون دورة</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="payout-amount">المبلغ</Label>
          <Input
            id="payout-amount"
            type="number"
            min={0}
            value={values.amount}
            onChange={(e) =>
              setValues({ ...values, amount: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="payout-date">تاريخ الدفع</Label>
          <Input
            id="payout-date"
            type="date"
            value={toDateInputValue(values.paidAt)}
            onChange={(e) => {
              const iso = new Date(`${e.target.value}T12:00:00`).toISOString()
              setValues({ ...values, paidAt: iso })
            }}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="payout-note">ملاحظة</Label>
        <Input
          id="payout-note"
          value={values.note}
          onChange={(e) => setValues({ ...values, note: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!values.trainerId}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

