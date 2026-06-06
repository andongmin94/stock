import type { KeyboardEvent, RefObject } from "react";
import { Plus, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { getAssetPrimaryName, getAssetSecondaryName } from "./asset-utils";
import { categoryTone } from "./constants";
import type { MarketAsset } from "@/lib/markets/types";

type AssetSearchDialogProps = {
  addCandidates: MarketAsset[];
  addQuery: string;
  boundedActiveCandidateIndex: number;
  candidateButtonsRef: {
    current: Map<string, HTMLButtonElement>;
  };
  hasAddQuery: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onActiveCandidateIndexChange: (index: number) => void;
  onAddAsset: (symbol: string) => void;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function AssetSearchDialog({
  addCandidates,
  addQuery,
  boundedActiveCandidateIndex,
  candidateButtonsRef,
  hasAddQuery,
  searchInputRef,
  onActiveCandidateIndexChange,
  onAddAsset,
  onClose,
  onQueryChange,
  onSearchKeyDown,
}: AssetSearchDialogProps) {
  return (
    <div
      className="search-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
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
            onClick={onClose}
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
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={onSearchKeyDown}
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
                onQueryChange("");
                searchInputRef.current?.focus();
              }}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        {addCandidates.length > 0 ? (
          <div className="search-dialog-results-frame">
            <div className="search-dialog-results" role="listbox">
              {addCandidates.map((asset, index) => (
                <button
                  key={asset.symbol}
                  ref={(node) => {
                    if (node) {
                      candidateButtonsRef.current.set(asset.symbol, node);
                      return;
                    }

                    candidateButtonsRef.current.delete(asset.symbol);
                  }}
                  type="button"
                  className={cn(
                    "neo-control search-result-card search-dialog-result-card flex min-w-0 items-center justify-between gap-3 rounded-[16px] text-left",
                    index === boundedActiveCandidateIndex &&
                      "search-result-active",
                  )}
                  onClick={() => onAddAsset(asset.symbol)}
                  onMouseEnter={() => onActiveCandidateIndexChange(index)}
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
                          categoryTone[asset.category],
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
  );
}
