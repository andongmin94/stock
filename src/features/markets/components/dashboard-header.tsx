import { Plus, RefreshCcw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { formatKrw, formatTime } from "../formatters"
import type { MarketResponse } from "../types"
import { ThemeButton, ViewModeButton } from "./market-controls"

type DashboardHeaderProps = {
  data: MarketResponse | null
  errorMessage: string | null
  isDataStale: boolean
  onOpenSearch: () => void
  onResetWatchlist: () => void
  onToggleTheme: () => void
  onToggleViewMode: () => void
}

export function DashboardHeader({
  data,
  errorMessage,
  isDataStale,
  onOpenSearch,
  onResetWatchlist,
  onToggleTheme,
  onToggleViewMode,
}: DashboardHeaderProps) {
  return (
    <header className="neo-panel flex flex-col gap-4 rounded-[18px] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center">
          <span
            role="img"
            aria-label="Stock"
            className="stock-logo-mark"
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-primary">
              Stock
            </h1>
            <Badge variant="outline" className="neo-pill rounded-full border-transparent px-3 text-primary">
              원화 시세
            </Badge>
            <Badge variant="secondary" className="neo-pill rounded-full border-transparent px-3 text-foreground">
              환율 {data ? formatKrw(data.usdtKrw) : "-"}
            </Badge>
            <button
              type="button"
              className="neo-search-shell search-open-trigger inline-flex h-9 min-w-[148px] items-center gap-2 rounded-full px-2.5 text-left"
              onClick={onOpenSearch}
            >
              <span className="neo-search-icon flex size-6 shrink-0 items-center justify-center rounded-full">
                <Search className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-black text-foreground">
                종목 추가
              </span>
              <span className="neo-primary search-open-pill inline-flex size-5 shrink-0 items-center justify-center rounded-full">
                <Plus className="size-3" />
              </span>
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Hyperliquid 가격을 원화로 환산해 기준가와 비교해요.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "neo-pill data-status-pill inline-flex h-9 items-center gap-2 rounded-full border-transparent px-3 text-sm font-semibold text-muted-foreground",
            (errorMessage || isDataStale) && "data-status-stale"
          )}
        >
          <span
            className={cn(
              "status-dot",
              (errorMessage || isDataStale) && "status-dot-stale"
            )}
          />
          {errorMessage
            ? "갱신 실패"
            : `최근 갱신 ${data ? formatTime(data.generatedAt) : "-"}`}
        </span>
        <ViewModeButton onToggle={onToggleViewMode} />
        <ThemeButton onToggle={onToggleTheme} />
        <Button
          type="button"
          variant="outline"
          onClick={onResetWatchlist}
        >
          <RefreshCcw className="size-4" />
          초기화
        </Button>
      </div>
    </header>
  )
}
