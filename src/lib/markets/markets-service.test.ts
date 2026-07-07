import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const providerMocks = vi.hoisted(() => ({
  fetchHyperliquidAnnotations: vi.fn(),
  fetchHyperliquidMarketData: vi.fn(),
  fetchKoreanCloses: vi.fn(),
  fetchUpbitTicker: vi.fn(),
}));

vi.mock("@/lib/markets/providers/hyperliquid-client", () => ({
  fetchHyperliquidAnnotations: providerMocks.fetchHyperliquidAnnotations,
  fetchHyperliquidMarketData: providerMocks.fetchHyperliquidMarketData,
}));

vi.mock("@/lib/markets/korean-closes", () => ({
  fetchKoreanCloses: providerMocks.fetchKoreanCloses,
}));

vi.mock("@/lib/markets/providers/upbit-client", () => ({
  fetchUpbitTicker: providerMocks.fetchUpbitTicker,
}));

describe("getMarkets", () => {
  beforeEach(() => {
    vi.resetModules();
    providerMocks.fetchHyperliquidAnnotations.mockReset();
    providerMocks.fetchHyperliquidMarketData.mockReset();
    providerMocks.fetchKoreanCloses.mockReset();
    providerMocks.fetchUpbitTicker.mockReset();

    providerMocks.fetchHyperliquidMarketData.mockResolvedValue([
      { universe: [{ name: "xyz:TEST" }] },
      [{ midPx: "50", prevDayPx: "49", dayNtlVlm: "1" }],
    ]);
    providerMocks.fetchKoreanCloses.mockResolvedValue(new Map());
    providerMocks.fetchUpbitTicker.mockResolvedValue(1_400);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("annotation 요청이 실패해도 핵심 시세를 반환한다", async () => {
    const consoleWarning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    providerMocks.fetchHyperliquidAnnotations.mockRejectedValue(
      new Error("annotations unavailable"),
    );
    const { getMarkets } = await import("./markets-service");

    const response = await getMarkets();

    expect(response.assets).toHaveLength(1);
    expect(response.assets[0]).toMatchObject({
      symbol: "xyz:TEST",
      displayName: "TEST",
      category: "기타",
      keywords: [],
      priceKrw: 70_000,
      referenceKrw: 68_600,
    });
    expect(consoleWarning).toHaveBeenCalledOnce();
  });

  it("갱신 실패 시 마지막 정상 캐시를 반환한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    providerMocks.fetchHyperliquidAnnotations.mockResolvedValue([]);
    const { getMarkets } = await import("./markets-service");
    const firstResponse = await getMarkets();

    vi.setSystemTime(14_001);
    providerMocks.fetchHyperliquidMarketData.mockRejectedValue(
      new Error("market unavailable"),
    );

    await expect(getMarkets()).resolves.toBe(firstResponse);
  });

  it("마지막 정상 캐시의 허용 시간이 지나면 갱신 오류를 반환한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    providerMocks.fetchHyperliquidAnnotations.mockResolvedValue([]);
    const { getMarkets } = await import("./markets-service");
    await getMarkets();

    vi.setSystemTime(130_001);
    providerMocks.fetchHyperliquidMarketData.mockRejectedValue(
      new Error("market unavailable"),
    );

    await expect(getMarkets()).rejects.toThrow("market unavailable");
  });
});
