import { useAppStore } from "@/store/useAppStore"

export function usePayouts() {
  const payouts = useAppStore((s) => s.payouts)
  const payoutCreate = useAppStore((s) => s.payoutCreate)
  const payoutRemove = useAppStore((s) => s.payoutRemove)
  const trainers = useAppStore((s) => s.trainers)
  const courses = useAppStore((s) => s.courses)

  return { payouts, payoutCreate, payoutRemove, trainers, courses }
}

