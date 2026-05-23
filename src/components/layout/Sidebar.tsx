import { NavLink } from "react-router-dom"
import {
  BookOpen,
  Building2,
  ClipboardList,
  Coins,
  GraduationCap,
  LayoutDashboard,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", Icon: LayoutDashboard },
  { to: "/institutes", label: "المعاهد", Icon: Building2 },
  { to: "/courses", label: "الدورات", Icon: BookOpen },
  { to: "/trainers", label: "المدربين", Icon: Users },
  { to: "/students", label: "الطلاب", Icon: GraduationCap },
  { to: "/enrollments", label: "التسجيلات", Icon: ClipboardList },
  { to: "/finance", label: "المالية", Icon: Coins },
]

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-background",
        className
      )}
    >
      <div className="px-4 py-4">
        <div className="text-base font-medium">Training Manager</div>
        <div className="text-sm text-muted-foreground">
          إدارة المعاهد والدورات
        </div>
      </div>
      <Separator />
      <nav className="flex flex-col gap-1 px-2 py-2">
        {navItems.map(({ to, label, Icon }) => (
          <Button
            key={to}
            asChild
            variant="ghost"
            className="justify-start"
          >
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex w-full items-center gap-2",
                  isActive && "text-foreground"
                )
              }
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </NavLink>
          </Button>
        ))}
      </nav>
      <div className="mt-auto px-4 py-4 text-xs text-muted-foreground">
        Local Data • Zustand + localStorage
      </div>
    </aside>
  )
}
