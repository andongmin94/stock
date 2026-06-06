import { fetchJson } from "@/lib/markets/fetch-json";
import type { YahooChartResponse } from "@/lib/markets/provider-types";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_TIMEOUT_MS = 5_000;

export async function fetchYahooChart(sourceSymbol: string) {
  try {
    return await fetchJson<YahooChartResponse>(
      `${YAHOO_CHART_URL}/${encodeURIComponent(sourceSymbol)}?range=10d&interval=1d`,
      {
        headers: {
          accept: "application/json",
          "user-agent": "Mozilla/5.0",
        },
        cache: "no-store",
        timeoutMs: YAHOO_TIMEOUT_MS,
      },
    );
  } catch (error) {
    throw new Error(
      error instanceof DOMException && error.name === "AbortError"
        ? "Yahoo Finance request timed out"
        : "Yahoo Finance request failed",
    );
  }
}
