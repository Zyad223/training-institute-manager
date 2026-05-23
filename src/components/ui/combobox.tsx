"use client"

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type ComboboxOption = {
  value: string
  label: string
  keywords?: string[]
}

export function Combobox({
  value,
  options,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText = "لا يوجد نتائج",
  disabled = false,
  className,
  buttonClassName,
}: {
  value: string
  options: ComboboxOption[]
  onValueChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  emptyText?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
}) {
  const selected = options.find((o) => o.value === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="false"
          disabled={disabled}
          className={cn("w-full justify-between", buttonClassName)}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", className)}>
        <Command
          filter={(itemValue, search, keywords) => {
            const hay = `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase()
            const needle = search.toLowerCase()
            return hay.includes(needle) ? 1 : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  keywords={o.keywords}
                  onSelect={() => onValueChange(o.value)}
                >
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === o.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
