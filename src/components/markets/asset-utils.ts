import type { MarketAsset } from "@/lib/markets/types"

export function matchesAsset(asset: MarketAsset, query: string) {
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

export function getAssetPrimaryName(asset: MarketAsset) {
  return asset.koreanName ?? asset.displayName
}

export function getAssetSecondaryName(asset: MarketAsset) {
  return asset.koreanName
    ? `${asset.displayName} · ${asset.symbol}`
    : asset.symbol
}
