import { useAppStore } from "@/store/useAppStore"

export function useStudents() {
  const students = useAppStore((s) => s.students)
  const studentCreate = useAppStore((s) => s.studentCreate)
  const studentUpdate = useAppStore((s) => s.studentUpdate)
  const studentRemove = useAppStore((s) => s.studentRemove)

  return { students, studentCreate, studentUpdate, studentRemove }
}

