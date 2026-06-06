"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DATA_STALE_MS } from "../constants";
import { getNextAutoRefreshDelay } from "../refresh-utils";
import type { MarketResponse } from "@/lib/markets/types";

export function useMarketsData() {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const hasFetchedInitialData = useRef(false);

  const fetchMarkets = useCallback(async () => {
    try {
      const response = await fetch("/api/markets", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("시세를 불러오지 못했습니다.");
      }

      const nextData = (await response.json()) as MarketResponse;
      setData(nextData);
      setErrorMessage(null);
    } catch {
      setErrorMessage("시세를 불러오지 못했습니다. 자동으로 다시 시도합니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 5_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasFetchedInitialData.current) {
      return;
    }

    hasFetchedInitialData.current = true;
    void fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    let autoRefreshTimer: number | undefined;
    let isCancelled = false;

    const scheduleNextAutoRefresh = () => {
      autoRefreshTimer = window.setTimeout(async () => {
        await fetchMarkets();

        if (!isCancelled) {
          scheduleNextAutoRefresh();
        }
      }, getNextAutoRefreshDelay());
    };

    scheduleNextAutoRefresh();

    return () => {
      isCancelled = true;

      if (autoRefreshTimer !== undefined) {
        window.clearTimeout(autoRefreshTimer);
      }
    };
  }, [fetchMarkets]);

  return {
    data,
    errorMessage,
    fetchMarkets,
    isDataStale: Boolean(data && clockNow - data.generatedAt > DATA_STALE_MS),
    loading,
  };
}
