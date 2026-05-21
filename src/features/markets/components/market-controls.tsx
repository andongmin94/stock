import { LayoutGrid, Moon, Sun, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function RemoveButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="목록에서 제거"
            onClick={onClick}
          >
            <X />
          </Button>
        }
      />
      <TooltipContent>목록에서 제거</TooltipContent>
    </Tooltip>
  )
}

export function ThemeButton({ onToggle }: { onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="테마 전환"
            onClick={onToggle}
          >
            <span className="theme-toggle-icon-stack">
              <Sun className="theme-toggle-icon theme-toggle-sun" />
              <Moon className="theme-toggle-icon theme-toggle-moon" />
            </span>
          </Button>
        }
      />
      <TooltipContent>테마 전환</TooltipContent>
    </Tooltip>
  )
}

export function ViewModeButton({ onToggle }: { onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="보기 모드 전환"
            onClick={onToggle}
          >
            <LayoutGrid className="size-4" />
          </Button>
        }
      />
      <TooltipContent>보기 모드 전환</TooltipContent>
    </Tooltip>
  )
}
