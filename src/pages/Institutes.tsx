import { useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"

import type { Institute } from "@/store/models"
import { useInstitutes } from "@/hooks/useInstitutes"
import { InstituteCard } from "@/features/institutes/InstituteCard"
import { InstituteForm } from "@/features/institutes/InstituteForm"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function Institutes() {
  const { institutes, instituteCreate, instituteRemove, instituteUpdate } =
    useInstitutes()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = useMemo<Institute | undefined>(() => {
    if (!editingId) return undefined
    return institutes.find((x) => x.id === editingId)
  }, [editingId, institutes])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-medium">المعاهد</div>
          <div className="text-sm text-muted-foreground">
            إضافة وتعديل وحذف المعاهد
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setOpen(true)
          }}
        >
          <PlusIcon className="size-4" />
          إضافة معهد
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل معهد" : "إضافة معهد"}</DialogTitle>
          </DialogHeader>
          <InstituteForm
            initial={editing}
            submitLabel={editing ? "تحديث" : "إنشاء"}
            onSubmit={(values) => {
              if (editing) instituteUpdate(editing.id, values)
              else instituteCreate(values)
              setOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {institutes.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا يوجد معاهد بعد. اضغط “إضافة معهد”.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {institutes.map((institute) => (
            <InstituteCard
              key={institute.id}
              institute={institute}
              onEdit={() => {
                setEditingId(institute.id)
                setOpen(true)
              }}
              onRemove={() => instituteRemove(institute.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

