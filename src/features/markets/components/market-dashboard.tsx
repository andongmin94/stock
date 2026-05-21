"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable"
import { RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { matchesAsset } from "@/features/markets/asset-utils"
import { AssetSearchDialog } from "@/features/markets/components/asset-search-dialog"
import { AssetCard } from "@/features/markets/components/asset-card"
import { DashboardHeader } from "@/features/markets/components/dashboard-header"
import { LoadingCards } from "@/features/markets/components/loading-cards"
import { SortableAssetCard } from "@/features/markets/components/sortable-asset-card"
import {
  CARD_ADD_ANIMATION_MS,
  DEFAULT_WATCHLIST,
} from "@/features/markets/constants"
import {
  cardCollisionDetection,
  getDragEndPoint,
  getSortableSymbolFromPoint,
} from "@/features/markets/drag-utils"
import { useDashboardPreferences } from "@/features/markets/hooks/use-dashboard-preferences"
import { useMarketsData } from "@/features/markets/hooks/use-markets-data"
import type { MarketAsset } from "@/features/markets/types"
import { cn } from "@/lib/utils"

export function MarketDashboard() {
  const {
    data,
    errorMessage,
    fetchMarkets,
    isDataStale,
    loading,
  } = useMarketsData()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [addQuery, setAddQuery] = useState("")
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0)
  const {
    setWatchlist,
    toggleTheme,
    toggleViewMode,
    viewMode,
    watchlist,
  } = useDashboardPreferences()
  const [activeDragSymbol, setActiveDragSymbol] = useState<string | null>(null)
  const [enteringSymbols, setEnteringSymbols] = useState<Set<string>>(
    () => new Set()
  )
  const searchInputRef = useRef<HTMLInputElement>(null)
  const cardAddTimers = useRef(new Map<string, number>())
  const candidateButtonsRef = useRef(new Map<string, HTMLButtonElement>())
  const lastPointerPointRef = useRef<{ x: number; y: number } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
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
  const assetBySymbol = useMemo(
    () => new Map(assets.map((asset) => [asset.symbol, asset])),
    [assets]
  )
  const watchSet = useMemo(() => new Set(watchlist), [watchlist])
  const hasAddQuery = addQuery.trim().length > 0
  const isCompact = viewMode === "compact"
  const visibleAssets = useMemo(() => {
    return watchlist
      .map((symbol) => assetBySymbol.get(symbol))
      .filter((asset): asset is MarketAsset => Boolean(asset))
      .filter((asset) => !asset.isDelisted)
  }, [assetBySymbol, watchlist])
  const visibleSymbols = useMemo(
    () => visibleAssets.map((asset) => asset.symbol),
    [visibleAssets]
  )
  const activeDragAsset = useMemo(() => {
    if (!activeDragSymbol) {
      return null
    }

    return assetBySymbol.get(activeDragSymbol) ?? null
  }, [activeDragSymbol, assetBySymbol])

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

  useEffect(() => {
    if (!isSearchOpen || addCandidates.length === 0) {
      return
    }

    const activeCandidate = addCandidates[boundedActiveCandidateIndex]
    if (!activeCandidate) {
      return
    }

    candidateButtonsRef.current.get(activeCandidate.symbol)?.scrollIntoView({
      block: "nearest",
    })
  }, [addCandidates, boundedActiveCandidateIndex, isSearchOpen])

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

    if (
      event.key === "Enter" &&
      !event.nativeEvent.isComposing &&
      addCandidates[boundedActiveCandidateIndex]
    ) {
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
  }

  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
        <DashboardHeader
          data={data}
          errorMessage={errorMessage}
          isDataStale={isDataStale}
          onOpenSearch={openSearchDialog}
          onResetWatchlist={resetWatchlist}
          onToggleTheme={toggleTheme}
          onToggleViewMode={toggleViewMode}
        />

        {errorMessage ? (
          <section
            className="neo-panel flex flex-col gap-3 rounded-[18px] p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
            role="status"
          >
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchMarkets()}
            >
              <RefreshCcw className="size-4" />
              재시도
            </Button>
          </section>
        ) : null}

        {isSearchOpen ? (
          <AssetSearchDialog
            addCandidates={addCandidates}
            addQuery={addQuery}
            boundedActiveCandidateIndex={boundedActiveCandidateIndex}
            candidateButtonsRef={candidateButtonsRef}
            hasAddQuery={hasAddQuery}
            searchInputRef={searchInputRef}
            onActiveCandidateIndexChange={setActiveCandidateIndex}
            onAddAsset={addAsset}
            onClose={closeSearchDialog}
            onQueryChange={(query) => {
              setAddQuery(query)
              setActiveCandidateIndex(0)
            }}
            onSearchKeyDown={handleSearchKeyDown}
          />
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
