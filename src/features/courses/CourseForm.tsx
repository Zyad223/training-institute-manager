import { useMemo, useState } from "react"

import type { Course, Institute, Trainer } from "@/store/models"
import {
  COURSE_STATUS,
  TRAINER_COMP_TYPES,
  type CourseStatus,
  type TrainerCompType,
} from "@/utils/constants"
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

type CourseFormValues = Omit<Course, "id" | "createdAt">

function toDateInputValue(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function toTimeInputValue(iso: string) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

export function CourseForm({
  institutes,
  trainers,
  initial,
  onSubmit,
  submitLabel = "حفظ",
}: {
  institutes: Institute[]
  trainers: Trainer[]
  initial?: Partial<CourseFormValues>
  onSubmit: (values: CourseFormValues) => void
  submitLabel?: string
}) {
  const defaults = useMemo<CourseFormValues>(
    () => ({
      instituteId: initial?.instituteId ?? (institutes[0]?.id ?? ""),
      trainerId: initial?.trainerId ?? null,
      trainerCompType: initial?.trainerCompType ?? "percent",
      trainerCompValue: initial?.trainerCompValue ?? 0,
      startAt: initial?.startAt ?? new Date().toISOString(),
      durationMinutes: initial?.durationMinutes ?? 0,
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      status: initial?.status ?? "draft",
    }),
    [initial, institutes]
  )

  const [values, setValues] = useState<CourseFormValues>(defaults)

  const trainerValue = values.trainerId ?? "__none__"

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!values.instituteId) return
        onSubmit({
          ...values,
          price: Number(values.price) || 0,
          trainerCompValue: Number(values.trainerCompValue) || 0,
          durationMinutes: Number(values.durationMinutes) || 0,
        })
      }}
    >
      <div className="grid gap-2">
        <Label>المعهد</Label>
        <Select
          value={values.instituteId}
          onValueChange={(v) => setValues({ ...values, instituteId: v })}
          disabled={institutes.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={institutes.length ? "اختر المعهد" : "أضف معهد أولاً"}
            />
          </SelectTrigger>
          <SelectContent>
            {institutes.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>المدرب</Label>
        <Select
          value={trainerValue}
          onValueChange={(v) =>
            setValues({ ...values, trainerId: v === "__none__" ? null : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر المدرب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">بدون مدرب</SelectItem>
            {trainers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>تعويض المدرب</Label>
          <Select
            value={values.trainerCompType}
            onValueChange={(v) =>
              setValues({ ...values, trainerCompType: v as TrainerCompType })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر نوع التعويض" />
            </SelectTrigger>
            <SelectContent>
              {TRAINER_COMP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "percent"
                    ? "نسبة من المدفوع"
                    : t === "per_student"
                      ? "لكل طالب"
                      : "ثابت للدورة"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="course-trainer-comp">
            {values.trainerCompType === "percent"
              ? "النسبة %"
              : values.trainerCompType === "per_student"
                ? "قيمة لكل طالب"
                : "قيمة ثابتة"}
          </Label>
          <Input
            id="course-trainer-comp"
            type="number"
            min={0}
            value={values.trainerCompValue}
            onChange={(e) =>
              setValues({ ...values, trainerCompValue: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="course-start-date">تاريخ البداية</Label>
          <Input
            id="course-start-date"
            type="date"
            value={toDateInputValue(values.startAt)}
            onChange={(e) => {
              const time = toTimeInputValue(values.startAt)
              const iso = new Date(`${e.target.value}T${time}:00`).toISOString()
              setValues({ ...values, startAt: iso })
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="course-start-time">وقت البداية</Label>
          <Input
            id="course-start-time"
            type="time"
            value={toTimeInputValue(values.startAt)}
            onChange={(e) => {
              const date = toDateInputValue(values.startAt)
              const iso = new Date(`${date}T${e.target.value}:00`).toISOString()
              setValues({ ...values, startAt: iso })
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="course-duration">مدة الدورة (دقائق)</Label>
          <Input
            id="course-duration"
            type="number"
            min={0}
            value={values.durationMinutes}
            onChange={(e) =>
              setValues({ ...values, durationMinutes: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="course-title">اسم الدورة</Label>
        <Input
          id="course-title"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="course-desc">الوصف</Label>
        <Input
          id="course-desc"
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="course-price">السعر</Label>
        <Input
          id="course-price"
          type="number"
          min={0}
          value={values.price}
          onChange={(e) =>
            setValues({ ...values, price: Number(e.target.value) })
          }
        />
      </div>

      <div className="grid gap-2">
        <Label>الحالة</Label>
        <Select
          value={values.status}
          onValueChange={(v) =>
            setValues({ ...values, status: v as CourseStatus })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "draft" ? "مسودة" : s === "published" ? "منشورة" : "مؤرشفة"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!values.instituteId}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
