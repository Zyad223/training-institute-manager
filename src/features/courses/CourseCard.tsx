import { PencilIcon, TrashIcon } from "lucide-react"

import type { Course, Institute, Trainer } from "@/store/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { coursePhaseLabel, formatDateTime, getCoursePhase } from "@/utils/helpers"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function statusLabel(status: Course["status"]) {
  if (status === "draft") return "مسودة"
  if (status === "published") return "منشورة"
  return "مؤرشفة"
}

export function CourseCard({
  course,
  institute,
  trainer,
  onEdit,
  onRemove,
}: {
  course: Course
  institute?: Institute
  trainer?: Trainer
  onEdit: () => void
  onRemove: () => void
}) {
  const phase = getCoursePhase(course.startAt, course.durationMinutes)

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate">{course.title}</CardTitle>
            <CardDescription className="truncate">
              {institute?.name ?? "بدون معهد"} • {course.description || "-"}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={onEdit}>
                <PencilIcon className="size-4" />
              </Button>
              <Button variant="destructive" size="icon-sm" onClick={onRemove}>
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </CardAction>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              course.status === "published"
                ? "default"
                : course.status === "draft"
                  ? "secondary"
                  : "outline"
            }
          >
            {statusLabel(course.status)}
          </Badge>
          <Badge
            variant={phase === "upcoming" ? "secondary" : phase === "ongoing" ? "default" : "outline"}
          >
            {coursePhaseLabel(phase)}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {course.price.toLocaleString("ar")} ر.س
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div>
          البداية:{" "}
          <span className="text-foreground">{formatDateTime(course.startAt)}</span>
        </div>
        <div>
          المدة:{" "}
          <span className="text-foreground">
            {Number(course.durationMinutes || 0).toLocaleString("ar")} دقيقة
          </span>
        </div>
        <div>
          مدرب: <span className="text-foreground">{trainer?.fullName ?? "غير محدد"}</span>
        </div>
        <div>
          أجر المدرب:{" "}
          <span className="text-foreground">
            {course.trainerCompType === "percent"
              ? `${Number(course.trainerCompValue || 0).toLocaleString("ar")}%`
              : course.trainerCompType === "per_student"
                ? `${Number(course.trainerCompValue || 0).toLocaleString("ar")} لكل طالب`
                : `${Number(course.trainerCompValue || 0).toLocaleString("ar")} ثابت`}
          </span>
        </div>
        رقم: <span className="text-foreground">{course.id}</span>
      </CardContent>
    </Card>
  )
}
