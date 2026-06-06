"use client";

import { useMemo } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssetCard } from "@/components/markets/asset-card";
import { AssetSearchDialog } from "@/components/markets/asset-search-dialog";
import { DashboardHeader } from "@/components/markets/dashboard-header";
import { LoadingCards } from "@/components/markets/loading-cards";
import { SortableAssetCard } from "@/components/markets/sortable-asset-card";
import { DEFAULT_WATCHLIST } from "@/components/markets/constants";
import { cardCollisionDetection } from "@/components/markets/drag-utils";
import { useAssetSearch } from "@/components/markets/hooks/use-asset-search";
import { useDashboardPreferences } from "@/components/markets/hooks/use-dashboard-preferences";
import { useEnteringCards } from "@/components/markets/hooks/use-entering-cards";
import { useMarketsData } from "@/components/markets/hooks/use-markets-data";
import { useSortableWatchlist } from "@/components/markets/hooks/use-sortable-watchlist";
import type { MarketAsset } from "@/lib/markets/types";
import { cn } from "@/lib/utils";

export function MarketDashboard() {
  const { data, errorMessage, fetchMarkets, isDataStale, loading } =
    useMarketsData();
  const { setWatchlist, toggleTheme, toggleViewMode, viewMode, watchlist } =
    useDashboardPreferences();
  const { clearEnteringCards, enteringSymbols, markCardEntering } =
    useEnteringCards();

  const assets = useMemo(() => data?.assets ?? [], [data]);
  const assetBySymbol = useMemo(
    () => new Map(assets.map((asset) => [asset.symbol, asset])),
    [assets],
  );
  const watchSet = useMemo(() => new Set(watchlist), [watchlist]);
  const isCompact = viewMode === "compact";
  const visibleAssets = useMemo(() => {
    return watchlist
      .map((symbol) => assetBySymbol.get(symbol))
      .filter((asset): asset is MarketAsset => Boolean(asset))
      .filter((asset) => !asset.isDelisted);
  }, [assetBySymbol, watchlist]);
  const visibleSymbols = useMemo(
    () => visibleAssets.map((asset) => asset.symbol),
    [visibleAssets],
  );

  const addAssetToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      markCardEntering(symbol);
    }

    setWatchlist((current) =>
      current.includes(symbol) ? current : [...current, symbol],
    );
  };
  const search = useAssetSearch({
    assets,
    excludedSymbols: watchSet,
    onSelectAsset: addAssetToWatchlist,
  });
  const {
    activeDragAsset,
    activeDragSymbol,
    handleSortCancel,
    handleSortEnd,
    handleSortStart,
    sensors,
  } = useSortableWatchlist({
    assetBySymbol,
    setWatchlist,
  });

  const removeAsset = (symbol: string) => {
    setWatchlist((current) => current.filter((item) => item !== symbol));
  };

  const resetWatchlist = () => {
    const nextWatchlist = [...DEFAULT_WATCHLIST];

    setWatchlist(nextWatchlist);
    search.closeSearchDialog();
    clearEnteringCards();
  };

  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
        <DashboardHeader
          data={data}
          errorMessage={errorMessage}
          isDataStale={isDataStale}
          onOpenSearch={search.openSearchDialog}
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

        {search.isSearchOpen ? (
          <AssetSearchDialog
            addCandidates={search.addCandidates}
            addQuery={search.addQuery}
            boundedActiveCandidateIndex={search.boundedActiveCandidateIndex}
            candidateButtonsRef={search.candidateButtonsRef}
            hasAddQuery={search.hasAddQuery}
            searchInputRef={search.searchInputRef}
            onActiveCandidateIndexChange={search.setActiveCandidateIndex}
            onAddAsset={search.selectAsset}
            onClose={search.closeSearchDialog}
            onQueryChange={search.updateAddQuery}
            onSearchKeyDown={search.handleSearchKeyDown}
          />
        ) : null}

        {loading ? (
          <LoadingCards
            compact={isCompact}
            count={Math.max(watchlist.length, DEFAULT_WATCHLIST.length)}
          />
        ) : visibleAssets.length > 0 ? (
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
                  activeDragSymbol && "sortable-card-grid-dragging",
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
            <DragOverlay adjustScale={false} dropAnimation={null}>
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
        )}
      </div>
    </main>
  );
}
