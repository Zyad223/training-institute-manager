import { useAppStore } from "@/store/useAppStore"

export function useInstitutes() {
  const institutes = useAppStore((s) => s.institutes)
  const instituteCreate = useAppStore((s) => s.instituteCreate)
  const instituteUpdate = useAppStore((s) => s.instituteUpdate)
  const instituteRemove = useAppStore((s) => s.instituteRemove)

  return { institutes, instituteCreate, instituteUpdate, instituteRemove }
}

