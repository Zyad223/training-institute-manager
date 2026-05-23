import { useMemo, useState } from "react"

import type { Student } from "@/store/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type StudentFormValues = Omit<Student, "id" | "createdAt">

export function StudentForm({
  initial,
  onSubmit,
  submitLabel = "حفظ",
}: {
  initial?: Partial<StudentFormValues>
  onSubmit: (values: StudentFormValues) => void
  submitLabel?: string
}) {
  const defaults = useMemo<StudentFormValues>(
    () => ({
      fullName: initial?.fullName ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
    }),
    [initial]
  )

  const [values, setValues] = useState<StudentFormValues>(defaults)

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="st-name">اسم الطالب</Label>
        <Input
          id="st-name"
          value={values.fullName}
          onChange={(e) => setValues({ ...values, fullName: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="st-phone">الهاتف</Label>
        <Input
          id="st-phone"
          value={values.phone}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="st-email">البريد</Label>
        <Input
          id="st-email"
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

