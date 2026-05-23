import { useMemo, useState } from "react"
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Link } from "react-router-dom"

import type { Student } from "@/store/models"
import { useStudents } from "@/hooks/useStudents"
import { StudentForm } from "@/features/students/StudentForm"
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

export function Students() {
  const { students, studentCreate, studentRemove, studentUpdate } =
    useStudents()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = useMemo<Student | undefined>(() => {
    if (!editingId) return undefined
    return students.find((x) => x.id === editingId)
  }, [editingId, students])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-medium">الطلاب</div>
          <div className="text-sm text-muted-foreground">
            إدارة الطلاب وحذف التسجيلات المرتبطة تلقائياً
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setOpen(true)
          }}
        >
          <PlusIcon className="size-4" />
          إضافة طالب
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
            <DialogTitle>{editing ? "تعديل طالب" : "إضافة طالب"}</DialogTitle>
          </DialogHeader>
          <StudentForm
            initial={editing}
            submitLabel={editing ? "تحديث" : "إنشاء"}
            onSubmit={(values) => {
              if (editing) studentUpdate(editing.id, values)
              else studentCreate(values)
              setOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {students.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا يوجد طلاب بعد. اضغط “إضافة طالب”.
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell>{s.phone || "-"}</TableCell>
                  <TableCell>{s.email || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button asChild variant="outline" size="icon-sm">
                        <Link to={`/students/${s.id}`}>
                          <EyeIcon className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => {
                          setEditingId(s.id)
                          setOpen(true)
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => studentRemove(s.id)}
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
