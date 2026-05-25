import { buildMarketAssets } from "@/lib/markets/build-market-assets"
import { fetchKoreanCloses } from "@/lib/markets/korean-closes"
import {
  fetchHyperliquidAnnotations,
  fetchHyperliquidMarketData,
} from "@/lib/markets/providers/hyperliquid-client"
import { fetchUpbitTicker } from "@/lib/markets/providers/upbit-client"
import type { MarketResponse } from "@/lib/markets/types"

export async function getMarkets(): Promise<MarketResponse> {
  const generatedAt = Date.now()

  try {
    const [marketData, annotationsData, usdtKrw] = await Promise.all([
      fetchHyperliquidMarketData(),
      fetchHyperliquidAnnotations(),
      fetchUpbitTicker(),
    ])

    const [meta, contexts] = marketData
    const annotations = new Map(annotationsData)
    const koreanCloses = await fetchKoreanCloses(
      meta.universe.map((asset) => asset.name)
    )
    const assets = buildMarketAssets({
      meta,
      contexts,
      annotations,
      koreanCloses,
      usdtKrw,
    })

    return {
      generatedAt,
      usdtKrw,
      assets,
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Market data request failed")
  }
}
