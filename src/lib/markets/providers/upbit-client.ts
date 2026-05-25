import { fetchJson } from "@/lib/markets/fetch-json"
import type { UpbitTicker } from "@/lib/markets/provider-types"

const UPBIT_USDT_KRW_URL = "https://api.upbit.com/v1/ticker?markets=KRW-USDT"
const UPBIT_TIMEOUT_MS = 5_000

export async function fetchUpbitTicker() {
  let tickers: unknown

  try {
    tickers = await fetchJson<unknown>(UPBIT_USDT_KRW_URL, {
      headers: { accept: "application/json" },
      cache: "no-store",
      timeoutMs: UPBIT_TIMEOUT_MS,
    })
  } catch (error) {
    throw new Error(
      error instanceof DOMException && error.name === "AbortError"
        ? "Upbit request timed out"
        : "Upbit request failed"
    )
  }

  if (!Array.isArray(tickers)) {
    throw new Error("Upbit ticker shape is invalid")
  }

  const ticker = tickers[0] as Partial<UpbitTicker> | undefined

  if (
    typeof ticker?.trade_price !== "number" ||
    !Number.isFinite(ticker.trade_price) ||
    ticker.trade_price <= 0
  ) {
    throw new Error("Upbit USDT/KRW price is missing")
  }

  return ticker.trade_price
}
