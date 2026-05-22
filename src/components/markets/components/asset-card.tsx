import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { getAssetPrimaryName, getAssetSecondaryName } from "../asset-utils"
import { categoryTone } from "../constants"
import {
  changeTone,
  formatChange,
  formatKrw,
  formatKrwChange,
  formatUsd,
} from "../formatters"
import type { MarketAsset } from "@/lib/markets/types"
import { AnimatedKrw } from "./animated-krw"
import { RemoveButton } from "./market-controls"

export function AssetCard({
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
                changeTone(asset.changeKrw)
              )}
            >
              {asset.changeKrw !== null && asset.changeKrw > 0 ? (
                <ArrowUpRight className="size-4" />
              ) : asset.changeKrw !== null && asset.changeKrw < 0 ? (
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
