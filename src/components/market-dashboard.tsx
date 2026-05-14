"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS as DndCss } from "@dnd-kit/utilities"
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  LayoutGrid,
  Moon,
  Plus,
  RefreshCcw,
  Search,
  Sun,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type MarketAsset = {
  symbol: string
  shortSymbol: string
  displayName: string
  koreanName: string | null
  category: string
  keywords: string[]
  isDelisted: boolean
  priceUsd: number | null
  priceKrw: number | null
  referenceKrw: number | null
  referenceLabel: string
  changeKrw: number | null
  changeRate: number | null
  tradeUrl: string
}

type MarketResponse = {
  generatedAt: number
  usdtKrw: number
  assets: MarketAsset[]
}

type RectLike = Pick<DOMRect, "bottom" | "left" | "right" | "top">
type ViewMode = "regular" | "compact"

const WATCHLIST_STORAGE_KEY = "hl-kr-watchlist-v2"
const THEME_STORAGE_KEY = "hl-kr-theme"
const VIEW_MODE_STORAGE_KEY = "hl-kr-view-mode"
const DEFAULT_WATCHLIST = [
  "xyz:SMSN",
  "xyz:SKHX",
]
const AUTO_REFRESH_INTERVAL_MS = 5_000
const MONEY_ANIMATION_MS = 650
const CARD_ADD_ANIMATION_MS = 560
const DATA_STALE_MS = 30_000

const categoryTone: Record<string, string> = {
  주식: "text-[#1267f4]",
  지수: "text-[#5364e8]",
  원자재: "text-[#a76614]",
  FX: "text-[#0f766e]",
  비상장: "text-[#7b52d4]",
  크립토: "text-[#0e7490]",
  기타: "text-[#6f7c8d]",
}

const krwFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 3,
})

const percentFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

const cardCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)

  return pointerCollisions.length > 0
    ? pointerCollisions
    : closestCenter(args)
}

function formatKrw(value: number | null) {
  if (value === null) {
    return "-"
  }

  return `₩${krwFormatter.format(value)}`
}

function formatKrwChange(value: number | null) {
  if (value === null) {
    return "-"
  }

  if (value === 0) {
    return "₩0"
  }

  const sign = value > 0 ? "+" : "-"
  return `${sign}₩${krwFormatter.format(Math.abs(value))}`
}

function formatUsd(value: number | null) {
  if (value === null) {
    return "-"
  }

  return usdFormatter.format(value)
}

function formatChange(value: number | null) {
  if (value === null) {
    return "-"
  }

  const sign = value > 0 ? "+" : ""
  return `${sign}${percentFormatter.format(value * 100)}%`
}

function formatTime(timestamp?: number) {
  if (!timestamp) {
    return "-"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp)
}

function loadJsonValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback
  }

  const saved = window.localStorage.getItem(key)

  if (!saved) {
    return fallback
  }

  try {
    return JSON.parse(saved) as T
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

function loadSavedWatchlist() {
  const savedWatchlist = loadJsonValue<string[] | null>(
    WATCHLIST_STORAGE_KEY,
    null
  )

  return Array.isArray(savedWatchlist) && savedWatchlist.length > 0
    ? savedWatchlist
    : DEFAULT_WATCHLIST
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3
}

function getDistanceToRect(
  rect: RectLike,
  clientX: number,
  clientY: number
) {
  const distanceX = Math.max(rect.left - clientX, 0, clientX - rect.right)
  const distanceY = Math.max(rect.top - clientY, 0, clientY - rect.bottom)

  return distanceX ** 2 + distanceY ** 2
}

function getLayoutRect(node: HTMLElement) {
  const offsetParent =
    node.offsetParent instanceof HTMLElement ? node.offsetParent : null
  const parentRect = offsetParent?.getBoundingClientRect()
  const fallbackRect = node.getBoundingClientRect()
  const left = parentRect ? parentRect.left + node.offsetLeft : fallbackRect.left
  const top = parentRect ? parentRect.top + node.offsetTop : fallbackRect.top

  return {
    bottom: top + node.offsetHeight,
    left,
    right: left + node.offsetWidth,
    top,
  }
}

function getDragEndPoint(event: DragEndEvent) {
  const sourceEvent = event.activatorEvent

  if (
    sourceEvent instanceof MouseEvent ||
    sourceEvent instanceof PointerEvent
  ) {
    return {
      x: sourceEvent.clientX + event.delta.x,
      y: sourceEvent.clientY + event.delta.y,
    }
  }

  return null
}

function getSortableSymbolFromPoint(
  clientX: number,
  clientY: number,
  activeSymbol: string
) {
  let closest:
    | {
        distance: number
        symbol: string
      }
    | null = null

  for (const node of document.querySelectorAll<HTMLElement>(
    "[data-sortable-symbol]"
  )) {
    const symbol = node.dataset.sortableSymbol

    if (!symbol || symbol === activeSymbol) {
      continue
    }

    const distance = getDistanceToRect(
      getLayoutRect(node),
      clientX,
      clientY
    )

    if (!closest || distance < closest.distance) {
      closest = {
        distance,
        symbol,
      }
    }
  }

  return closest?.symbol ?? null
}

function getNextAutoRefreshDelay() {
  const remainder = Date.now() % AUTO_REFRESH_INTERVAL_MS

  if (remainder === 0) {
    return AUTO_REFRESH_INTERVAL_MS
  }

  return AUTO_REFRESH_INTERVAL_MS - remainder
}

function AnimatedKrw({
  value,
  fallback = "-",
}: {
  value: number | null
  fallback?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const displayValueRef = useRef(value)
  const frameRef = useRef<number | null>(null)
  const [movement, setMovement] = useState<"up" | "down" | null>(null)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const fromValue = displayValueRef.current

    if (value === null || fromValue === null || fromValue === value) {
      displayValueRef.current = value
      frameRef.current = window.requestAnimationFrame(() => {
        setDisplayValue(value)
        setMovement(null)
        frameRef.current = null
      })
      return
    }

    const startedAt = performance.now()
    const direction = value > fromValue ? "up" : "down"

    setMovement(direction)
    setAnimationKey((current) => current + 1)

    const tick = (now: number) => {
      const progress = Math.min(
        (now - startedAt) / MONEY_ANIMATION_MS,
        1
      )
      const easedProgress = easeOutCubic(progress)
      const nextValue = fromValue + (value - fromValue) * easedProgress

      displayValueRef.current = nextValue
      setDisplayValue(nextValue)

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick)
        return
      }

      displayValueRef.current = value
      setDisplayValue(value)
      frameRef.current = null
    }

    frameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [value])

  return (
    <span
      key={animationKey}
      className={cn(
        "money-value inline-block tabular-nums",
        movement === "up" && "money-value-up",
        movement === "down" && "money-value-down"
      )}
    >
      {displayValue === null ? fallback : formatKrw(displayValue)}
    </span>
  )
}

function changeTone(value: number | null) {
  if (value === null || value === 0) {
    return "text-muted-foreground"
  }

  return value > 0 ? "text-[#d92d5c]" : "text-[#2563eb]"
}

function matchesAsset(asset: MarketAsset, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    asset.symbol,
    asset.shortSymbol,
    asset.displayName,
    asset.koreanName ?? "",
    asset.category,
    ...asset.keywords,
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(normalized)
}

function getAssetPrimaryName(asset: MarketAsset) {
  return asset.koreanName ?? asset.displayName
}

function getAssetSecondaryName(asset: MarketAsset) {
  return asset.koreanName
    ? `${asset.displayName} · ${asset.symbol}`
    : asset.symbol
}

function RemoveButton({
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

function ThemeButton({ onToggle }: { onToggle: () => void }) {
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

function ViewModeButton({ onToggle }: { onToggle: () => void }) {
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

function AssetCard({
  asset,
  onRemove,
  compact = false,
  isPreview = false,
}: {
  asset: MarketAsset
  onRemove: () => void
  compact?: boolean
  isPreview?: boolean
}) {
  const movementValue = asset.changeKrw
  const primaryName = getAssetPrimaryName(asset)
  const secondaryName = getAssetSecondaryName(asset)

  return (
    <Card
      className={cn(
        "neo-panel neo-hover-glow gap-0 rounded-[18px] py-0",
        compact && "asset-card-compact"
      )}
    >
      <CardHeader className={cn("gap-2 px-4 pb-3 pt-4", compact && "pb-2")}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="truncate text-base font-bold tracking-normal text-foreground">
              {primaryName}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger
                render={
                  <a
                    className="neo-control inline-flex size-7 shrink-0 items-center justify-center rounded-[12px] text-primary transition-colors hover:border-[#8fb8ff] hover:text-primary"
                    href={asset.tradeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${primaryName} 거래 화면 열기`}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                }
              />
              <TooltipContent>거래 화면 열기</TooltipContent>
            </Tooltip>
            {!compact ? (
              <Badge
                variant="outline"
                className={cn(
                  "neo-pill rounded-full border-transparent px-2.5 font-bold",
                  categoryTone[asset.category]
                )}
              >
                {asset.category}
              </Badge>
            ) : null}
            {asset.isDelisted && !compact ? (
              <Badge variant="secondary" className="neo-pill rounded-full border-transparent">
                종료
              </Badge>
            ) : null}
          </div>
          {!compact ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {secondaryName}
            </p>
          ) : null}
        </div>
        {!isPreview ? (
          <CardAction>
            <RemoveButton onClick={onRemove} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-3 px-4 pb-4", compact && "space-y-2 pb-3")}>
        <div className={cn("min-w-0 px-1 py-3", compact && "py-1")}>
          <div
            className={cn(
              "truncate font-black leading-tight tracking-tight text-foreground tabular-nums",
              compact ? "text-[1.55rem]" : "text-[1.8rem]"
            )}
          >
            <AnimatedKrw value={asset.priceKrw} />
          </div>
          <div className={cn("flex flex-wrap items-center gap-2 text-sm", compact ? "mt-1" : "mt-2")}>
            <span className="text-muted-foreground">
              {asset.referenceLabel} 대비
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-bold",
                changeTone(movementValue)
              )}
            >
              {movementValue !== null && movementValue > 0 ? (
                <ArrowUpRight className="size-4" />
              ) : movementValue !== null && movementValue < 0 ? (
                <ArrowDownRight className="size-4" />
              ) : null}
              {formatKrwChange(asset.changeKrw)}
            </span>
            <span className={cn("font-bold", changeTone(asset.changeRate))}>
              {formatChange(asset.changeRate)}
            </span>
          </div>
          {!compact ? (
            <div className="mt-1 text-xs text-muted-foreground">
              기준 {asset.referenceLabel} {formatKrw(asset.referenceKrw)} ·{" "}
              {formatUsd(asset.priceUsd)}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingCards({
  compact,
  count,
}: {
  compact: boolean
  count: number
}) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2",
        compact ? "xl:grid-cols-4" : "xl:grid-cols-3"
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card
          className={cn(
            "neo-panel gap-0 rounded-[18px] py-0",
            compact && "asset-card-compact"
          )}
          key={index}
        >
          <CardHeader className={cn("gap-2 px-4 pb-3 pt-4", compact && "pb-2")}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="size-7 rounded-[12px]" />
                {!compact ? (
                  <Skeleton className="h-6 w-10 rounded-full" />
                ) : null}
              </div>
              {!compact ? (
                <Skeleton className="mt-2 h-3 w-32" />
              ) : null}
            </div>
            <CardAction>
              <Skeleton className="size-7 rounded-[12px]" />
            </CardAction>
          </CardHeader>
          <CardContent className={cn("space-y-3 px-4 pb-4", compact && "space-y-2 pb-3")}>
            <div className={cn("min-w-0 px-1 py-3", compact && "py-1")}>
              <Skeleton
                className={cn(
                  "h-9 w-44 rounded-[12px]",
                  compact && "h-8 w-36"
                )}
              />
              <div className={cn("flex items-center gap-2", compact ? "mt-2" : "mt-3")}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              {!compact ? (
                <Skeleton className="mt-2 h-3 w-44" />
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SortableAssetCard({
  asset,
  compact,
  isEntering,
  onRemove,
}: {
  asset: MarketAsset
  compact: boolean
  isEntering: boolean
  onRemove: () => void
}) {
  const {
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: asset.symbol,
    transition: {
      duration: 260,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  })
  const style: CSSProperties = {
    transform: DndCss.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      data-sortable-symbol={asset.symbol}
      className={cn(
        "sortable-card-shell",
        isDragging && "sortable-card-dragging",
        isEntering && !isDragging && "sortable-card-enter"
      )}
      style={style}
      {...listeners}
    >
      <AssetCard
        asset={asset}
        onRemove={onRemove}
        compact={compact}
      />
    </div>
  )
}

export function MarketDashboard() {
  const [data, setData] = useState<MarketResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [addQuery, setAddQuery] = useState("")
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false)
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false)
  const [clockNow, setClockNow] = useState(() => Date.now())
  const [viewMode, setViewMode] = useState<ViewMode>("regular")
  const [activeDragSymbol, setActiveDragSymbol] = useState<string | null>(null)
  const [enteringSymbols, setEnteringSymbols] = useState<Set<string>>(
    () => new Set()
  )
  const searchInputRef = useRef<HTMLInputElement>(null)
  const cardAddTimers = useRef(new Map<string, number>())
  const lastPointerPointRef = useRef<{ x: number; y: number } | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  const fetchMarkets = useCallback(async () => {
    try {
      const response = await fetch("/api/markets", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("시세를 불러오지 못했습니다.")
      }

      const nextData = (await response.json()) as MarketResponse
      setData(nextData)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
      const nextIsDark =
        savedTheme === "dark" ||
        (savedTheme !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)

      setIsDark(nextIsDark)
      setHasLoadedTheme(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setViewMode(loadJsonValue<ViewMode>(VIEW_MODE_STORAGE_KEY, "regular"))
      setWatchlist(loadSavedWatchlist())
      setHasLoadedLocalState(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hasLoadedTheme) {
      return
    }

    document.documentElement.classList.toggle("dark", isDark)
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light")
  }, [hasLoadedTheme, isDark])

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 5_000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!hasLoadedLocalState) {
      return
    }

    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify(watchlist)
    )
  }, [hasLoadedLocalState, watchlist])

  useEffect(() => {
    if (!hasLoadedLocalState) {
      return
    }

    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, JSON.stringify(viewMode))
  }, [hasLoadedLocalState, viewMode])

  useEffect(() => {
    const timers = cardAddTimers.current

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  useEffect(() => {
    const updatePointerPoint = (event: PointerEvent) => {
      lastPointerPointRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
    }

    document.addEventListener("pointerdown", updatePointerPoint, {
      passive: true,
    })
    document.addEventListener("pointermove", updatePointerPoint, {
      passive: true,
    })

    return () => {
      document.removeEventListener("pointerdown", updatePointerPoint)
      document.removeEventListener("pointermove", updatePointerPoint)
    }
  }, [])

  useEffect(() => {
    let autoRefreshTimer: number | undefined
    let isCancelled = false

    const scheduleNextAutoRefresh = () => {
      autoRefreshTimer = window.setTimeout(async () => {
        await fetchMarkets()

        if (!isCancelled) {
          scheduleNextAutoRefresh()
        }
      }, getNextAutoRefreshDelay())
    }

    scheduleNextAutoRefresh()

    return () => {
      isCancelled = true

      if (autoRefreshTimer !== undefined) {
        window.clearTimeout(autoRefreshTimer)
      }
    }
  }, [fetchMarkets])

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 60)

    document.body.style.overflow = "hidden"

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [isSearchOpen])

  const assets = useMemo(() => data?.assets ?? [], [data])
  const watchSet = useMemo(() => new Set(watchlist), [watchlist])
  const hasAddQuery = addQuery.trim().length > 0
  const isCompact = viewMode === "compact"
  const isDataStale = Boolean(data && clockNow - data.generatedAt > DATA_STALE_MS)
  const displayWatchlist = watchlist

  const visibleAssets = useMemo(() => {
    return displayWatchlist
      .map((symbol) => assets.find((asset) => asset.symbol === symbol))
      .filter((asset): asset is MarketAsset => Boolean(asset))
      .filter((asset) => !asset.isDelisted)
  }, [assets, displayWatchlist])
  const visibleSymbols = useMemo(
    () => visibleAssets.map((asset) => asset.symbol),
    [visibleAssets]
  )
  const activeDragAsset = useMemo(() => {
    if (!activeDragSymbol) {
      return null
    }

    return assets.find((asset) => asset.symbol === activeDragSymbol) ?? null
  }, [activeDragSymbol, assets])

  const addCandidates = useMemo(() => {
    if (!hasAddQuery) {
      return []
    }

    return assets
      .filter((asset) => !watchSet.has(asset.symbol))
      .filter((asset) => !asset.isDelisted)
      .filter((asset) => matchesAsset(asset, addQuery))
      .slice(0, 8)
  }, [addQuery, assets, hasAddQuery, watchSet])
  const boundedActiveCandidateIndex =
    addCandidates.length > 0
      ? Math.min(activeCandidateIndex, addCandidates.length - 1)
      : 0

  const markCardEntering = (symbol: string) => {
    setEnteringSymbols((current) => {
      const nextSymbols = new Set(current)
      nextSymbols.add(symbol)
      return nextSymbols
    })

    const currentTimer = cardAddTimers.current.get(symbol)
    if (currentTimer) {
      window.clearTimeout(currentTimer)
    }

    const nextTimer = window.setTimeout(() => {
      setEnteringSymbols((current) => {
        if (!current.has(symbol)) {
          return current
        }

        const nextSymbols = new Set(current)
        nextSymbols.delete(symbol)
        return nextSymbols
      })
      cardAddTimers.current.delete(symbol)
    }, CARD_ADD_ANIMATION_MS + 120)

    cardAddTimers.current.set(symbol, nextTimer)
  }

  const openSearchDialog = () => {
    setIsSearchOpen(true)
    setActiveCandidateIndex(0)
  }

  const closeSearchDialog = () => {
    setIsSearchOpen(false)
    setAddQuery("")
    setActiveCandidateIndex(0)
  }

  const addAsset = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      markCardEntering(symbol)
    }

    setWatchlist((current) =>
      current.includes(symbol) ? current : [...current, symbol]
    )
    setAddQuery("")
    setActiveCandidateIndex(0)

    if (isSearchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && addCandidates.length > 0) {
      event.preventDefault()
      setActiveCandidateIndex((current) =>
        current + 1 >= addCandidates.length ? 0 : current + 1
      )
      return
    }

    if (event.key === "ArrowUp" && addCandidates.length > 0) {
      event.preventDefault()
      setActiveCandidateIndex((current) =>
        current - 1 < 0 ? addCandidates.length - 1 : current - 1
      )
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      if (addQuery) {
        setAddQuery("")
        return
      }

      if (isSearchOpen) {
        closeSearchDialog()
      }
      return
    }

    if (event.key === "Enter" && addCandidates[boundedActiveCandidateIndex]) {
      event.preventDefault()
      addAsset(addCandidates[boundedActiveCandidateIndex].symbol)
    }
  }

  const removeAsset = (symbol: string) => {
    setWatchlist((current) =>
      current.filter((item) => item !== symbol)
    )
  }

  const handleSortStart = (event: DragStartEvent) => {
    setActiveDragSymbol(String(event.active.id))
  }

  const handleSortCancel = () => {
    setActiveDragSymbol(null)
  }

  const handleSortEnd = (event: DragEndEvent) => {
    const activeSymbol = String(event.active.id)
    const dragEndPoint = lastPointerPointRef.current ?? getDragEndPoint(event)
    const directOverSymbol = event.over ? String(event.over.id) : null
    const fallbackOverSymbol = dragEndPoint
      ? getSortableSymbolFromPoint(
          dragEndPoint.x,
          dragEndPoint.y,
          activeSymbol
        )
      : null
    const overSymbol =
      directOverSymbol && directOverSymbol !== activeSymbol
        ? directOverSymbol
        : fallbackOverSymbol

    setActiveDragSymbol(null)

    if (!overSymbol || activeSymbol === overSymbol) {
      return
    }

    setWatchlist((current) => {
      const activeIndex = current.indexOf(activeSymbol)
      const overIndex = current.indexOf(overSymbol)

      if (activeIndex === -1 || overIndex === -1) {
        return current
      }

      return arrayMove(current, activeIndex, overIndex)
    })
  }

  const resetWatchlist = () => {
    const nextWatchlist = [...DEFAULT_WATCHLIST]

    setWatchlist(nextWatchlist)
    setAddQuery("")
    setActiveCandidateIndex(0)
    setIsSearchOpen(false)
    setEnteringSymbols(new Set())
    for (const timer of cardAddTimers.current.values()) {
      window.clearTimeout(timer)
    }
    cardAddTimers.current.clear()
    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify(nextWatchlist)
    )
  }

  const toggleTheme = () => {
    setIsDark((current) => !current)
  }

  const toggleViewMode = () => {
    setViewMode((current) => (current === "compact" ? "regular" : "compact"))
  }

  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
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
                  onClick={openSearchDialog}
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
                isDataStale && "data-status-stale"
              )}
            >
              <span className={cn("status-dot", isDataStale && "status-dot-stale")} />
              최근 갱신 {data ? formatTime(data.generatedAt) : "-"}
            </span>
            <ViewModeButton onToggle={toggleViewMode} />
            <ThemeButton onToggle={toggleTheme} />
            <Button
              type="button"
              variant="outline"
              onClick={resetWatchlist}
            >
              <RefreshCcw className="size-4" />
              초기화
            </Button>
          </div>
        </header>

        {isSearchOpen ? (
          <div
            className="search-dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeSearchDialog()
              }
            }}
          >
            <div
              className="search-dialog-panel neo-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="asset-search-dialog-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    id="asset-search-dialog-title"
                    className="text-lg font-black tracking-normal text-foreground"
                  >
                    종목 추가
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    한국어 이름, 티커, 별칭으로 검색할 수 있어요.
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="search-dialog-close"
                  aria-label="검색 창 닫기"
                  onClick={closeSearchDialog}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="neo-search-shell search-dialog-input-shell mt-4 flex h-12 items-center gap-3 rounded-full px-3">
                <span className="neo-search-icon flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Search className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Input
                    ref={searchInputRef}
                    value={addQuery}
                    onChange={(event) => {
                      setAddQuery(event.target.value)
                      setActiveCandidateIndex(0)
                    }}
                    onKeyDown={handleSearchKeyDown}
                    className="neo-search-input h-full rounded-none px-0 text-[15px] font-bold tracking-normal placeholder:font-semibold focus-visible:ring-0"
                    placeholder="예: 테슬라, 애플, 엔비디아, TSLA"
                  />
                </div>
                {addQuery ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="neo-search-clear"
                    aria-label="검색어 지우기"
                    onClick={() => {
                      setAddQuery("")
                      setActiveCandidateIndex(0)
                      searchInputRef.current?.focus()
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>

              {addCandidates.length > 0 ? (
                <div className="search-dialog-results-frame">
                  <div
                    className="search-dialog-results"
                    role="listbox"
                  >
                    {addCandidates.map((asset, index) => (
                      <button
                        key={asset.symbol}
                        type="button"
                        className={cn(
                          "neo-control search-result-card search-dialog-result-card flex min-w-0 items-center justify-between gap-3 rounded-[16px] text-left",
                          index === boundedActiveCandidateIndex && "search-result-active"
                        )}
                        onClick={() => addAsset(asset.symbol)}
                        onMouseEnter={() => setActiveCandidateIndex(index)}
                        aria-label={`${getAssetPrimaryName(asset)} 추가`}
                        role="option"
                        aria-selected={index === boundedActiveCandidateIndex}
                      >
                        <span className="search-result-copy min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-black text-foreground">
                              {getAssetPrimaryName(asset)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "neo-pill rounded-full border-transparent px-2 font-bold",
                                categoryTone[asset.category]
                              )}
                            >
                              {asset.category}
                            </Badge>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {getAssetSecondaryName(asset)}
                          </span>
                        </span>
                        <span className="neo-primary search-result-plus inline-flex size-7 shrink-0 items-center justify-center rounded-full">
                          <Plus className="size-4" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="neo-search-empty search-dialog-empty rounded-[16px] px-4 py-4 text-sm font-medium text-muted-foreground">
                  {hasAddQuery
                    ? "추가할 종목이 없습니다."
                    : "검색어를 입력하면 추가 가능한 종목이 여기에 표시됩니다."}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {loading ? (
          <LoadingCards
            compact={isCompact}
            count={Math.max(watchlist.length, DEFAULT_WATCHLIST.length)}
          />
        ) : (
          visibleAssets.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={cardCollisionDetection}
              onDragStart={handleSortStart}
              onDragCancel={handleSortCancel}
              onDragEnd={handleSortEnd}
            >
              <SortableContext
                items={visibleSymbols}
                strategy={rectSortingStrategy}
              >
                <section
                  className={cn(
                    "sortable-card-grid grid gap-4 md:grid-cols-2",
                    isCompact ? "xl:grid-cols-4" : "xl:grid-cols-3",
                    activeDragSymbol && "sortable-card-grid-dragging"
                  )}
                >
                  {visibleAssets.map((asset) => (
                    <SortableAssetCard
                      key={asset.symbol}
                      asset={asset}
                      compact={isCompact}
                      isEntering={enteringSymbols.has(asset.symbol)}
                      onRemove={() => removeAsset(asset.symbol)}
                    />
                  ))}
                </section>
              </SortableContext>
              <DragOverlay
                adjustScale={false}
                dropAnimation={{
                  duration: 210,
                  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {activeDragAsset ? (
                  <div className="sortable-drag-preview">
                    <AssetCard
                      asset={activeDragAsset}
                      onRemove={() => undefined}
                      compact={isCompact}
                      isPreview
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <section className="neo-panel rounded-[18px] p-8 text-center text-sm text-muted-foreground">
              목록에 담긴 종목이 없습니다.
            </section>
          )
        )}
      </div>
    </main>
  )
}
