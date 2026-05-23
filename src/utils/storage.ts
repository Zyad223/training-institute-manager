export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function storageGet<T>(key: string): T | null {
  return safeJsonParse<T>(localStorage.getItem(key))
}

export function storageSet<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function storageRemove(key: string) {
  localStorage.removeItem(key)
}

