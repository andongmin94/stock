"use client"

import type { CSSProperties } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS as DndCss } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"

import type { MarketAsset } from "@/lib/markets/types"
import { AssetCard } from "./asset-card"

export function SortableAssetCard({
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
    transition: isDragging ? "none" : transition,
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
