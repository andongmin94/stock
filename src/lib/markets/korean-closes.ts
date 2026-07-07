import { fetchYahooChart } from "@/lib/markets/providers/yahoo-client";
import type {
  KoreanClose,
  YahooChartResponse,
} from "@/lib/markets/provider-types";

const KOREAN_CLOSE_CACHE_TTL_MS = 60_000;
const KOREAN_CLOSE_ERROR_CACHE_TTL_MS = 15_000;
const KOREAN_CLOSE_SETTLE_SECONDS = 60;

const koreanCloseSources: Record<string, string> = {
  "xyz:HYUNDAI": "005380.KS",
  "xyz:SKHX": "000660.KS",
  "xyz:SMSN": "005930.KS",
};

const koreanCloseCache = new Map<
  string,
  {
    close: KoreanClose | null;
    expiresAt: number;
  }
>();

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isIncompleteCurrentSession(
  timestamp: number,
  regularPeriod: { start?: number; end?: number } | undefined,
  nowSeconds: number,
) {
  const start = toNumber(regularPeriod?.start);
  const end = toNumber(regularPeriod?.end);

  return (
    start !== null &&
    end !== null &&
    timestamp >= start &&
    timestamp < end &&
    nowSeconds < end + KOREAN_CLOSE_SETTLE_SECONDS
  );
}

export function parseYahooClose(
  data: YahooChartResponse,
  nowMs = Date.now(),
): KoreanClose | null {
  const result = data.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const timestamps = result?.timestamp ?? [];
  const regularPeriod = result?.meta?.currentTradingPeriod?.regular;
  const nowSeconds = Math.floor(nowMs / 1_000);

  for (let index = closes.length - 1; index >= 0; index -= 1) {
    const priceKrw = toNumber(closes[index]);
    const timestamp = toNumber(timestamps[index]);

    if (
      priceKrw !== null &&
      timestamp !== null &&
      !isIncompleteCurrentSession(timestamp, regularPeriod, nowSeconds)
    ) {
      return {
        priceKrw,
      };
    }
  }

  const fallbackPrice = toNumber(result?.meta?.previousClose);

  if (fallbackPrice === null) {
    return null;
  }

  return {
    priceKrw: fallbackPrice,
  };
}

async function fetchKoreanClose(sourceSymbol: string) {
  const now = Date.now();
  const cached = koreanCloseCache.get(sourceSymbol);

  if (cached && cached.expiresAt > now) {
    return cached.close;
  }

  try {
    const data = await fetchYahooChart(sourceSymbol);
    const close = parseYahooClose(data);

    koreanCloseCache.set(sourceSymbol, {
      close,
      expiresAt: now + KOREAN_CLOSE_CACHE_TTL_MS,
    });

    return close;
  } catch {
    koreanCloseCache.set(sourceSymbol, {
      close: null,
      expiresAt: now + KOREAN_CLOSE_ERROR_CACHE_TTL_MS,
    });

    return null;
  }
}

export async function fetchKoreanCloses(assetSymbols: string[]) {
  const assetSources = new Map<string, string>();

  for (const assetSymbol of assetSymbols) {
    const sourceSymbol = koreanCloseSources[assetSymbol];

    if (sourceSymbol) {
      assetSources.set(assetSymbol, sourceSymbol);
    }
  }

  const sourceSymbols = Array.from(new Set(assetSources.values()));
  if (sourceSymbols.length === 0) {
    return new Map<string, KoreanClose | null>();
  }

  const sourceEntries = await Promise.all(
    sourceSymbols.map(async (sourceSymbol) => {
      const close = await fetchKoreanClose(sourceSymbol);

      return [sourceSymbol, close] as const;
    }),
  );
  const closesBySource = new Map(sourceEntries);

  return new Map(
    Array.from(assetSources, ([assetSymbol, sourceSymbol]) => [
      assetSymbol,
      closesBySource.get(sourceSymbol) ?? null,
    ]),
  );
}
