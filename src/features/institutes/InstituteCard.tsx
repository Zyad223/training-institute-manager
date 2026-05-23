import { PencilIcon, TrashIcon } from "lucide-react"

import type { Institute } from "@/store/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function InstituteCard({
  institute,
  onEdit,
  onRemove,
}: {
  institute: Institute
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate">{institute.name}</CardTitle>
            <CardDescription className="truncate">
              {institute.city} • {institute.address}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={onEdit}>
                <PencilIcon className="size-4" />
              </Button>
              <Button variant="destructive" size="icon-sm" onClick={onRemove}>
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </CardAction>
        </div>
        <div>
          <Badge variant={institute.status === "active" ? "default" : "secondary"}>
            {institute.status === "active" ? "نشط" : "غير نشط"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1 text-sm">
        <div className="text-muted-foreground">
          هاتف: <span className="text-foreground">{institute.phone || "-"}</span>
        </div>
        <div className="text-muted-foreground">
          بريد: <span className="text-foreground">{institute.email || "-"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

