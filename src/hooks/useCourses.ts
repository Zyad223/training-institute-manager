import { useAppStore } from "@/store/useAppStore"

export function useCourses() {
  const courses = useAppStore((s) => s.courses)
  const courseCreate = useAppStore((s) => s.courseCreate)
  const courseUpdate = useAppStore((s) => s.courseUpdate)
  const courseRemove = useAppStore((s) => s.courseRemove)
  const institutes = useAppStore((s) => s.institutes)
  const trainers = useAppStore((s) => s.trainers)

  return { courses, institutes, trainers, courseCreate, courseUpdate, courseRemove }
}
