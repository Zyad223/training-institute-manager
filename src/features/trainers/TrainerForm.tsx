import { useMemo, useState } from "react"

import type { Trainer } from "@/store/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TrainerFormValues = Omit<Trainer, "id" | "createdAt">

export function TrainerForm({
  initial,
  onSubmit,
  submitLabel = "حفظ",
}: {
  initial?: Partial<TrainerFormValues>
  onSubmit: (values: TrainerFormValues) => void
  submitLabel?: string
}) {
  const defaults = useMemo<TrainerFormValues>(
    () => ({
      fullName: initial?.fullName ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      specialty: initial?.specialty ?? "",
    }),
    [initial]
  )

  const [values, setValues] = useState<TrainerFormValues>(defaults)

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="tr-name">اسم المدرب</Label>
        <Input
          id="tr-name"
          value={values.fullName}
          onChange={(e) => setValues({ ...values, fullName: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tr-specialty">التخصص</Label>
        <Input
          id="tr-specialty"
          value={values.specialty}
          onChange={(e) => setValues({ ...values, specialty: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tr-phone">الهاتف</Label>
        <Input
          id="tr-phone"
          value={values.phone}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tr-email">البريد</Label>
        <Input
          id="tr-email"
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

