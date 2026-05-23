import { useAppStore } from "@/store/useAppStore"

export function useEnrollments() {
  const enrollments = useAppStore((s) => s.enrollments)
  const enrollmentCreate = useAppStore((s) => s.enrollmentCreate)
  const enrollmentUpdate = useAppStore((s) => s.enrollmentUpdate)
  const enrollmentRemove = useAppStore((s) => s.enrollmentRemove)
  const students = useAppStore((s) => s.students)
  const courses = useAppStore((s) => s.courses)

  return {
    enrollments,
    students,
    courses,
    enrollmentCreate,
    enrollmentUpdate,
    enrollmentRemove,
  }
}

