import { useMemo, useState } from "react"
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react"

import type { Trainer } from "@/store/models"
import { useTrainers } from "@/hooks/useTrainers"
import { TrainerForm } from "@/features/trainers/TrainerForm"
import { Button } from "@/components/ui/button"
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

export function Trainers() {
  const { trainers, trainerCreate, trainerRemove, trainerUpdate } =
    useTrainers()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = useMemo<Trainer | undefined>(() => {
    if (!editingId) return undefined
    return trainers.find((x) => x.id === editingId)
  }, [editingId, trainers])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-medium">المدربين</div>
          <div className="text-sm text-muted-foreground">
            إضافة وتعديل وحذف المدربين
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setOpen(true)
          }}
        >
          <PlusIcon className="size-4" />
          إضافة مدرب
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
            <DialogTitle>{editing ? "تعديل مدرب" : "إضافة مدرب"}</DialogTitle>
          </DialogHeader>
          <TrainerForm
            initial={editing}
            submitLabel={editing ? "تحديث" : "إنشاء"}
            onSubmit={(values) => {
              if (editing) trainerUpdate(editing.id, values)
              else trainerCreate(values)
              setOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {trainers.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا يوجد مدربين بعد. اضغط “إضافة مدرب”.
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>التخصص</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.fullName}</TableCell>
                  <TableCell>{t.specialty || "-"}</TableCell>
                  <TableCell>{t.phone || "-"}</TableCell>
                  <TableCell>{t.email || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => {
                          setEditingId(t.id)
                          setOpen(true)
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => trainerRemove(t.id)}
                      >
                        <TrashIcon className="size-4" />
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
  )
}

