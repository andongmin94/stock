import { buildMarketAssets } from "@/lib/markets/build-market-assets";
import { fetchKoreanCloses } from "@/lib/markets/korean-closes";
import {
  fetchHyperliquidAnnotations,
  fetchHyperliquidMarketData,
} from "@/lib/markets/providers/hyperliquid-client";
import { fetchUpbitTicker } from "@/lib/markets/providers/upbit-client";
import type { MarketResponse } from "@/lib/markets/types";

const MARKETS_CACHE_TTL_MS = 4_000;

let cachedMarkets: {
  data: MarketResponse;
  expiresAt: number;
} | null = null;
let pendingMarketsRequest: Promise<MarketResponse> | null = null;

export async function getMarkets(): Promise<MarketResponse> {
  const now = Date.now();

  if (cachedMarkets && cachedMarkets.expiresAt > now) {
    return cachedMarkets.data;
  }

  pendingMarketsRequest ??= fetchFreshMarkets()
    .then((data) => {
      cachedMarkets = {
        data,
        expiresAt: Date.now() + MARKETS_CACHE_TTL_MS,
      };

      return data;
    })
    .finally(() => {
      pendingMarketsRequest = null;
    });

  return pendingMarketsRequest;
}

async function fetchFreshMarkets(): Promise<MarketResponse> {
  const generatedAt = Date.now();

  try {
    const [marketData, annotationsData, usdtKrw] = await Promise.all([
      fetchHyperliquidMarketData(),
      fetchHyperliquidAnnotations(),
      fetchUpbitTicker(),
    ]);

    const [meta, contexts] = marketData;
    const annotations = new Map(annotationsData);
    const koreanCloses = await fetchKoreanCloses(
      meta.universe.map((asset) => asset.name),
    );
    const assets = buildMarketAssets({
      meta,
      contexts,
      annotations,
      koreanCloses,
      usdtKrw,
    });

    return {
      generatedAt,
      usdtKrw,
      assets,
    };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Market data request failed");
  }
}
