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
  const activeRequestController = useRef<AbortController | null>(null);
  const latestRequestId = useRef(0);

  const fetchMarkets = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    activeRequestController.current?.abort();

    const controller = new AbortController();
    activeRequestController.current = controller;

    try {
      const response = await fetch("/api/markets", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("시세를 불러오지 못했습니다.");
      }

      const nextData = (await response.json()) as MarketResponse;

      if (requestId !== latestRequestId.current) {
        return;
      }

      setData(nextData);
      setErrorMessage(null);
    } catch (error) {
      if (
        requestId !== latestRequestId.current ||
        (error instanceof DOMException && error.name === "AbortError")
      ) {
        return;
      }

      setErrorMessage("시세를 불러오지 못했습니다. 자동으로 다시 시도합니다.");
    } finally {
      if (requestId === latestRequestId.current) {
        activeRequestController.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      latestRequestId.current += 1;
      activeRequestController.current?.abort();
    };
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
        if (!activeRequestController.current) {
          await fetchMarkets();
        }

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
