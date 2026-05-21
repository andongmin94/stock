import type { MarketAsset, MarketResponse } from "@/features/markets/types"

const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info"
const UPBIT_USDT_KRW_URL = "https://api.upbit.com/v1/ticker?markets=KRW-USDT"
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart"
const KOREAN_CLOSE_CACHE_TTL_MS = 60_000
const KOREAN_CLOSE_ERROR_CACHE_TTL_MS = 15_000

const koreanCloseSources: Record<string, string> = {
  "xyz:HYUNDAI": "005380.KS",
  "xyz:SKHX": "000660.KS",
  "xyz:SMSN": "005930.KS",
}

type HyperliquidAsset = {
  name: string
  isDelisted?: boolean
}

type HyperliquidContext = {
  prevDayPx?: string
  dayNtlVlm?: string
  oraclePx?: string
  markPx?: string
  midPx?: string | null
}

type HyperliquidMeta = {
  universe: HyperliquidAsset[]
}

type Annotation = {
  category?: string
  displayName?: string
  keywords?: string[]
}

type UpbitTicker = {
  trade_price: number
}

type YahooChartResponse = {
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

type KoreanClose = {
  priceKrw: number
}

const koreanCloseCache = new Map<
  string,
  {
    close: KoreanClose | null
    expiresAt: number
  }
>()

const categoryLabels: Record<string, string> = {
  stocks: "주식",
  indices: "지수",
  commodities: "원자재",
  fx: "FX",
  preipo: "비상장",
  crypto: "크립토",
}

const koreanAssetLabels: Record<
  string,
  {
    koreanName: string
    aliases: string[]
  }
> = {
  "xyz:AAPL": {
    koreanName: "애플",
    aliases: ["아이폰", "맥북", "apple"],
  },
  "xyz:AMD": {
    koreanName: "AMD",
    aliases: ["에이엠디", "어드밴스드 마이크로 디바이시스", "advanced micro devices"],
  },
  "xyz:AMZN": {
    koreanName: "아마존",
    aliases: ["아마존닷컴", "amazon"],
  },
  "xyz:BABA": {
    koreanName: "알리바바",
    aliases: ["알리", "alibaba"],
  },
  "xyz:BIRD": {
    koreanName: "올버즈",
    aliases: ["allbirds"],
  },
  "xyz:BX": {
    koreanName: "블랙스톤",
    aliases: ["blackstone"],
  },
  "xyz:COIN": {
    koreanName: "코인베이스",
    aliases: ["coinbase"],
  },
  "xyz:COST": {
    koreanName: "코스트코",
    aliases: ["costco"],
  },
  "xyz:CRCL": {
    koreanName: "서클",
    aliases: ["circle"],
  },
  "xyz:CRWV": {
    koreanName: "코어위브",
    aliases: ["coreweave"],
  },
  "xyz:DKNG": {
    koreanName: "드래프트킹스",
    aliases: ["draftkings"],
  },
  "xyz:DRAM": {
    koreanName: "DRAM ETF",
    aliases: ["디램", "메모리", "memory"],
  },
  "xyz:EWJ": {
    koreanName: "일본 ETF",
    aliases: ["일본", "japan"],
  },
  "xyz:EWY": {
    koreanName: "한국 ETF",
    aliases: ["한국", "korea"],
  },
  "xyz:EWZ": {
    koreanName: "브라질 ETF",
    aliases: ["브라질", "brazil"],
  },
  "xyz:GME": {
    koreanName: "게임스탑",
    aliases: ["gamestop", "밈주식"],
  },
  "xyz:GOOGL": {
    koreanName: "구글",
    aliases: ["알파벳", "google", "alphabet"],
  },
  "xyz:HIMS": {
    koreanName: "힘스앤허스",
    aliases: ["힘스", "hims", "hims & hers"],
  },
  "xyz:HOOD": {
    koreanName: "로빈후드",
    aliases: ["robinhood"],
  },
  "xyz:HYUNDAI": {
    koreanName: "현대차",
    aliases: ["현대자동차", "현대", "005380", "005380.KS"],
  },
  "xyz:INTC": {
    koreanName: "인텔",
    aliases: ["intel"],
  },
  "xyz:KIOXIA": {
    koreanName: "키옥시아",
    aliases: ["kioxia"],
  },
  "xyz:LITE": {
    koreanName: "루멘텀",
    aliases: ["lumentum"],
  },
  "xyz:LLY": {
    koreanName: "일라이릴리",
    aliases: ["릴리", "eli lilly", "elililly"],
  },
  "xyz:META": {
    koreanName: "메타",
    aliases: ["페이스북", "facebook"],
  },
  "xyz:MRVL": {
    koreanName: "마벨",
    aliases: ["마벨 테크놀로지", "marvell"],
  },
  "xyz:MSFT": {
    koreanName: "마이크로소프트",
    aliases: ["마소", "microsoft"],
  },
  "xyz:MSTR": {
    koreanName: "스트래티지",
    aliases: ["마이크로스트래티지", "microstrategy", "strategy"],
  },
  "xyz:MU": {
    koreanName: "마이크론",
    aliases: ["micron"],
  },
  "xyz:NFLX": {
    koreanName: "넷플릭스",
    aliases: ["netflix"],
  },
  "xyz:NVDA": {
    koreanName: "엔비디아",
    aliases: ["엔비", "nvidia"],
  },
  "xyz:ORCL": {
    koreanName: "오라클",
    aliases: ["oracle"],
  },
  "xyz:PLTR": {
    koreanName: "팔란티어",
    aliases: ["palantir"],
  },
  "xyz:RIVN": {
    koreanName: "리비안",
    aliases: ["rivian"],
  },
  "xyz:RKLB": {
    koreanName: "로켓랩",
    aliases: ["rocketlab", "rocket lab"],
  },
  "xyz:SKHX": {
    koreanName: "SK하이닉스",
    aliases: ["하이닉스", "에스케이하이닉스", "000660", "000660.KS"],
  },
  "xyz:SMSN": {
    koreanName: "삼성전자",
    aliases: ["삼성", "삼전", "005930", "005930.KS"],
  },
  "xyz:SNDK": {
    koreanName: "샌디스크",
    aliases: ["sandisk"],
  },
  "xyz:SOFTBANK": {
    koreanName: "소프트뱅크",
    aliases: ["softbank"],
  },
  "xyz:TSLA": {
    koreanName: "테슬라",
    aliases: ["tesla", "일론", "전기차"],
  },
  "xyz:TSM": {
    koreanName: "TSMC",
    aliases: ["티에스엠씨", "대만반도체", "타이완반도체", "taiwan semiconductor"],
  },
  "xyz:URNM": {
    koreanName: "우라늄 ETF",
    aliases: ["우라늄", "uranium"],
  },
  "xyz:USAR": {
    koreanName: "USA 레어어스",
    aliases: ["희토류", "레어어스", "rare earth", "rareearth"],
  },
  "xyz:XLE": {
    koreanName: "에너지 ETF",
    aliases: ["에너지", "energy"],
  },
  "xyz:ZM": {
    koreanName: "줌",
    aliases: ["줌비디오", "zoom"],
  },
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function categoryLabel(category?: string) {
  if (!category) {
    return "기타"
  }

  return categoryLabels[category.toLowerCase()] ?? category.toUpperCase()
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  )
}

async function postHyperliquid<T>(body: Record<string, unknown>) {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Hyperliquid request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

async function fetchUpbitTicker() {
  const response = await fetch(UPBIT_USDT_KRW_URL, {
    headers: { accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Upbit request failed: ${response.status}`)
  }

  const tickers = (await response.json()) as UpbitTicker[]
  const ticker = tickers[0]

  if (!ticker?.trade_price) {
    throw new Error("Upbit USDT/KRW price is missing")
  }

  return ticker.trade_price
}

function parseYahooClose(data: YahooChartResponse): KoreanClose | null {
  const result = data.chart?.result?.[0]
  const closes = result?.indicators?.quote?.[0]?.close ?? []

  for (let index = closes.length - 1; index >= 0; index -= 1) {
    const priceKrw = toNumber(closes[index])

    if (priceKrw !== null) {
      return {
        priceKrw,
      }
    }
  }

  const fallbackPrice = toNumber(result?.meta?.regularMarketPrice)

  if (fallbackPrice === null) {
    return null
  }

  return {
    priceKrw: fallbackPrice,
  }
}

async function fetchKoreanClose(sourceSymbol: string) {
  const now = Date.now()
  const cached = koreanCloseCache.get(sourceSymbol)

  if (cached && cached.expiresAt > now) {
    return cached.close
  }

  try {
    const response = await fetch(
      `${YAHOO_CHART_URL}/${encodeURIComponent(sourceSymbol)}?range=10d&interval=1d`,
      {
        headers: {
          accept: "application/json",
          "user-agent": "Mozilla/5.0",
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo Finance request failed: ${response.status}`)
    }

    const data = (await response.json()) as YahooChartResponse
    const close = parseYahooClose(data)

    koreanCloseCache.set(sourceSymbol, {
      close,
      expiresAt: now + KOREAN_CLOSE_CACHE_TTL_MS,
    })

    return close
  } catch {
    koreanCloseCache.set(sourceSymbol, {
      close: null,
      expiresAt: now + KOREAN_CLOSE_ERROR_CACHE_TTL_MS,
    })

    return null
  }
}

async function fetchKoreanCloses(assetSymbols: string[]) {
  const assetSources = new Map<string, string>()

  for (const assetSymbol of assetSymbols) {
    const sourceSymbol = koreanCloseSources[assetSymbol]

    if (sourceSymbol) {
      assetSources.set(assetSymbol, sourceSymbol)
    }
  }

  const sourceSymbols = Array.from(new Set(assetSources.values()))
  if (sourceSymbols.length === 0) {
    return new Map<string, KoreanClose | null>()
  }

  const sourceEntries = await Promise.all(
    sourceSymbols.map(async (sourceSymbol) => {
      const close = await fetchKoreanClose(sourceSymbol)

      return [sourceSymbol, close] as const
    })
  )
  const closesBySource = new Map(sourceEntries)

  return new Map(
    Array.from(assetSources, ([assetSymbol, sourceSymbol]) => [
      assetSymbol,
      closesBySource.get(sourceSymbol) ?? null,
    ])
  )
}

export async function getMarkets(): Promise<MarketResponse> {
  const generatedAt = Date.now()

  try {
    const [marketData, annotationsData, usdtKrw] = await Promise.all([
      postHyperliquid<[HyperliquidMeta, HyperliquidContext[]]>({
        type: "metaAndAssetCtxs",
        dex: "xyz",
      }),
      postHyperliquid<[string, Annotation][]>({
        type: "perpConciseAnnotations",
      }),
      fetchUpbitTicker(),
    ])

    const [meta, contexts] = marketData
    const annotations = new Map(annotationsData)
    const koreanCloses = await fetchKoreanCloses(
      meta.universe.map((asset) => asset.name)
    )

    const assets: MarketAsset[] = meta.universe
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
      .map(({ asset }) => asset)

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
