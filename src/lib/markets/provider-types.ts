type HyperliquidAsset = {
  name: string
  isDelisted?: boolean
}

export type HyperliquidContext = {
  prevDayPx?: string | number
  dayNtlVlm?: string | number
  oraclePx?: string | number
  markPx?: string | number
  midPx?: string | number | null
}

export type HyperliquidMeta = {
  universe: HyperliquidAsset[]
}

export type HyperliquidAnnotation = {
  category?: string
  displayName?: string
  keywords?: string[]
}

export type HyperliquidMarketData = [
  HyperliquidMeta,
  HyperliquidContext[],
]

export type HyperliquidAnnotationEntry = [
  string,
  HyperliquidAnnotation,
]

export type UpbitTicker = {
  trade_price: number
}

export type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number
      }
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>
        }>
      }
    }>
  }
}

export type KoreanClose = {
  priceKrw: number
}
