import { categoryLabel, koreanAssetLabels } from "@/lib/markets/market-labels"
import type {
  HyperliquidAnnotation,
  HyperliquidContext,
  HyperliquidMeta,
  KoreanClose,
} from "@/lib/markets/provider-types"
import type { MarketAsset } from "@/lib/markets/types"

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  )
}

export function buildMarketAssets({
  meta,
  contexts,
  annotations,
  koreanCloses,
  usdtKrw,
}: {
  meta: HyperliquidMeta
  contexts: HyperliquidContext[]
  annotations: Map<string, HyperliquidAnnotation>
  koreanCloses: Map<string, KoreanClose | null>
  usdtKrw: number
}) {
  return meta.universe
    .map((asset, index) => {
      const context = contexts[index] ?? {}
      const annotation = annotations.get(asset.name)
      const shortSymbol = asset.name.replace("xyz:", "")
      const displayName = annotation?.displayName ?? shortSymbol
      const koreanLabel = koreanAssetLabels[asset.name]
      const priceUsd =
        toNumber(context.midPx) ??
        toNumber(context.markPx) ??
        toNumber(context.oraclePx)
      const prevUsd = toNumber(context.prevDayPx)
      const priceKrw = priceUsd !== null ? priceUsd * usdtKrw : null
      const prevKrw = prevUsd !== null ? prevUsd * usdtKrw : null
      const dayNtlVlmUsd = toNumber(context.dayNtlVlm)
      const koreanClose = koreanCloses.get(asset.name) ?? null
      const referenceKrw = koreanClose?.priceKrw ?? prevKrw
      const referenceLabel = koreanClose ? "한국 종가" : "HL 전일가"
      const changeKrw =
        priceKrw !== null && referenceKrw !== null
          ? priceKrw - referenceKrw
          : null
      const changeRate =
        changeKrw !== null && referenceKrw ? changeKrw / referenceKrw : null

      return {
        asset: {
          symbol: asset.name,
          shortSymbol,
          displayName,
          koreanName: koreanLabel?.koreanName ?? null,
          category: categoryLabel(annotation?.category),
          keywords: uniqueStrings([
            ...(annotation?.keywords ?? []),
            koreanLabel?.koreanName,
            ...(koreanLabel?.aliases ?? []),
          ]),
          isDelisted: Boolean(asset.isDelisted),
          priceUsd,
          priceKrw,
          referenceKrw,
          referenceLabel,
          changeKrw,
          changeRate,
          tradeUrl: `https://app.hyperliquid.xyz/trade/${encodeURIComponent(asset.name)}`,
        },
        sortVolumeUsd: dayNtlVlmUsd ?? 0,
      }
    })
    .sort((a, b) => {
      if (a.asset.isDelisted !== b.asset.isDelisted) {
        return a.asset.isDelisted ? 1 : -1
      }

      return (
        b.sortVolumeUsd - a.sortVolumeUsd ||
        a.asset.shortSymbol.localeCompare(b.asset.shortSymbol)
      )
    })
    .map(({ asset }) => asset satisfies MarketAsset)
}
