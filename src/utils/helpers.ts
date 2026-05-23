export function genId(prefix: string) {
  const random = Math.random().toString(16).slice(2, 10)
  return `${prefix}_${Date.now().toString(16)}_${random}`
}

export function genReceiptNo() {
  const random = Math.random().toString(10).slice(2, 6)
  return `R-${new Date().getFullYear()}-${Date.now().toString(10)}-${random}`
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export type CoursePhase = "upcoming" | "ongoing" | "ended"

export function getCoursePhase(startAtIso: string, durationMinutes: number): CoursePhase {
  const now = Date.now()
  const start = new Date(startAtIso).getTime()
  if (Number.isNaN(start)) return "upcoming"
  if (start > now) return "upcoming"
  const dur = Number(durationMinutes) || 0
  if (dur <= 0) return "ongoing"
  const end = start + dur * 60 * 1000
  return now > end ? "ended" : "ongoing"
}

export function coursePhaseLabel(phase: CoursePhase) {
  if (phase === "upcoming") return "قادمة"
  if (phase === "ongoing") return "جارية"
  return "منتهية"
}

function csvEscape(value: unknown) {
  const s = String(value ?? "")
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ]
  const csv = `\uFEFF${lines.join("\n")}`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
