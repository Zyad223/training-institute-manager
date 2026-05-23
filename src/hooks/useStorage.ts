import { useCallback } from "react"

import { storageGet, storageRemove, storageSet } from "@/utils/storage"

export function useStorage() {
  const get = useCallback(<T,>(key: string) => storageGet<T>(key), [])
  const set = useCallback(<T,>(key: string, value: T) => storageSet(key, value), [])
  const remove = useCallback((key: string) => storageRemove(key), [])

  return { get, set, remove }
}

