import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { DownloadIcon, MenuIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/Sidebar"
import { usePwaInstall } from "@/hooks/usePwaInstall"

const routeTitles: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/institutes": "إدارة المعاهد",
  "/courses": "إدارة الدورات",
  "/trainers": "إدارة المدربين",
  "/students": "إدارة الطلاب",
  "/enrollments": "إدارة التسجيلات",
  "/finance": "المالية والتقارير",
}

export function Topbar() {
  const location = useLocation()
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("tim.theme")
    return saved === "dark" ? "dark" : "light"
  })
  const { canInstall, promptInstall } = usePwaInstall()

  const title = useMemo(() => {
    if (location.pathname.startsWith("/students/")) return "تفاصيل الطالب"
    return routeTitles[location.pathname] ?? "Training Manager"
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem("tim.theme", theme)
    if (theme === "dark") document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [theme])

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <MenuIcon className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar className="w-72 border-r-0" />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-3">
          <div className="font-medium">{title}</div>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <div className="hidden text-sm text-muted-foreground md:block">
            نظام إدارة المراكز والمعاهد التدريبية
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canInstall && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void promptInstall()
            }}
          >
            <DownloadIcon className="size-4" />
            تثبيت
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark")
          }}
        >
          {theme === "dark" ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
        </Button>
        <div className="text-xs text-muted-foreground">v0.1</div>
      </div>
    </header>
  )
}
