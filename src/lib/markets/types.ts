export type MarketAsset = {
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

export type MarketResponse = {
  generatedAt: number
  usdtKrw: number
  assets: MarketAsset[]
}

export type ViewMode = "regular" | "compact"
