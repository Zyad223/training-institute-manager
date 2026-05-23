import { useAppStore } from "@/store/useAppStore"

export function useTrainers() {
  const trainers = useAppStore((s) => s.trainers)
  const trainerCreate = useAppStore((s) => s.trainerCreate)
  const trainerUpdate = useAppStore((s) => s.trainerUpdate)
  const trainerRemove = useAppStore((s) => s.trainerRemove)

  return { trainers, trainerCreate, trainerUpdate, trainerRemove }
}

