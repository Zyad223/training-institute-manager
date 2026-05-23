import { useMemo, useState } from "react"

import type { Institute } from "@/store/models"
import { INSTITUTE_STATUS, type InstituteStatus } from "@/utils/constants"
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

type InstituteFormValues = Omit<Institute, "id" | "createdAt">

export function InstituteForm({
  initial,
  onSubmit,
  submitLabel = "حفظ",
}: {
  initial?: Partial<InstituteFormValues>
  onSubmit: (values: InstituteFormValues) => void
  submitLabel?: string
}) {
  const defaults = useMemo<InstituteFormValues>(
    () => ({
      name: initial?.name ?? "",
      city: initial?.city ?? "",
      address: initial?.address ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      status: initial?.status ?? "active",
    }),
    [initial]
  )

  const [values, setValues] = useState<InstituteFormValues>(defaults)

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="inst-name">اسم المعهد</Label>
        <Input
          id="inst-name"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inst-city">المدينة</Label>
        <Input
          id="inst-city"
          value={values.city}
          onChange={(e) => setValues({ ...values, city: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inst-address">العنوان</Label>
        <Input
          id="inst-address"
          value={values.address}
          onChange={(e) => setValues({ ...values, address: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inst-phone">الهاتف</Label>
        <Input
          id="inst-phone"
          value={values.phone}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inst-email">البريد</Label>
        <Input
          id="inst-email"
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>الحالة</Label>
        <Select
          value={values.status}
          onValueChange={(v) =>
            setValues({ ...values, status: v as InstituteStatus })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            {INSTITUTE_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "active" ? "نشط" : "غير نشط"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

