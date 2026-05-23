import { useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"

import type { Course } from "@/store/models"
import { useCourses } from "@/hooks/useCourses"
import { CourseCard } from "@/features/courses/CourseCard"
import { CourseForm } from "@/features/courses/CourseForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCoursePhase } from "@/utils/helpers"

export function Courses() {
  const { courses, institutes, trainers, courseCreate, courseRemove, courseUpdate } =
    useCourses()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [phase, setPhase] = useState<"all" | "upcoming" | "ongoing" | "ended">("all")

  const editing = useMemo<Course | undefined>(() => {
    if (!editingId) return undefined
    return courses.find((x) => x.id === editingId)
  }, [editingId, courses])

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses
      .filter((c) => {
        if (phase === "all") return true
        return getCoursePhase(c.startAt, c.durationMinutes) === phase
      })
      .filter((c) => {
        if (!q) return true
        return (
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [courses, phase, query])

  const phaseCounts = useMemo(() => {
    let upcoming = 0
    let ongoing = 0
    let ended = 0
    for (const c of courses) {
      const p = getCoursePhase(c.startAt, c.durationMinutes)
      if (p === "upcoming") upcoming++
      else if (p === "ongoing") ongoing++
      else ended++
    }
    return { all: courses.length, upcoming, ongoing, ended }
  }, [courses])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-medium">الدورات</div>
          <div className="text-sm text-muted-foreground">
            إدارة الدورات وربطها بالمعاهد
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setOpen(true)
          }}
          disabled={institutes.length === 0}
        >
          <PlusIcon className="size-4" />
          إضافة دورة
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث عن دورة..."
          className="h-9 w-full sm:w-80"
        />
        <Tabs value={phase} onValueChange={(v) => setPhase(v as typeof phase)}>
          <TabsList>
            <TabsTrigger value="all">الكل ({phaseCounts.all})</TabsTrigger>
            <TabsTrigger value="upcoming">قادمة ({phaseCounts.upcoming})</TabsTrigger>
            <TabsTrigger value="ongoing">جارية ({phaseCounts.ongoing})</TabsTrigger>
            <TabsTrigger value="ended">منتهية ({phaseCounts.ended})</TabsTrigger>
          </TabsList>
        </Tabs>
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
            <DialogTitle>{editing ? "تعديل دورة" : "إضافة دورة"}</DialogTitle>
          </DialogHeader>
          <CourseForm
            institutes={institutes}
            trainers={trainers}
            initial={editing}
            submitLabel={editing ? "تحديث" : "إنشاء"}
            onSubmit={(values) => {
              if (editing) courseUpdate(editing.id, values)
              else courseCreate(values)
              setOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {institutes.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لإضافة دورات، قم بإضافة معهد أولاً من صفحة المعاهد.
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا يوجد دورات بعد. اضغط “إضافة دورة”.
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
          لا توجد نتائج مطابقة للبحث/الفلترة.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              institute={institutes.find((i) => i.id === course.instituteId)}
              trainer={
                course.trainerId
                  ? trainers.find((t) => t.id === course.trainerId)
                  : undefined
              }
              onEdit={() => {
                setEditingId(course.id)
                setOpen(true)
              }}
              onRemove={() => courseRemove(course.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
