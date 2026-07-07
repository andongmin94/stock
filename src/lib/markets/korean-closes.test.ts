import { describe, expect, it } from "vitest";

import { parseYahooClose } from "./korean-closes";
import type { YahooChartResponse } from "./provider-types";

const SESSION_START = 1_000;
const SESSION_END = 2_000;

function createChartResponse({
  closes,
  previousClose,
  timestamps,
}: {
  closes: Array<number | null>;
  previousClose?: number;
  timestamps: Array<number | null>;
}): YahooChartResponse {
  return {
    chart: {
      result: [
        {
          meta: {
            currentTradingPeriod: {
              regular: {
                start: SESSION_START,
                end: SESSION_END,
              },
            },
            previousClose,
          },
          timestamp: timestamps,
          indicators: {
            quote: [{ close: closes }],
          },
        },
      ],
    },
  };
}

describe("parseYahooClose", () => {
  it("장중에는 미완료 당일 봉 대신 직전 종가를 선택한다", () => {
    const data = createChartResponse({
      timestamps: [500, SESSION_START],
      closes: [71_000, 72_000],
    });

    expect(parseYahooClose(data, 1_500_000)).toEqual({ priceKrw: 71_000 });
  });

  it("정규장 종료와 데이터 확정 유예 후에는 당일 마감 봉을 선택한다", () => {
    const data = createChartResponse({
      timestamps: [500, SESSION_START],
      closes: [71_000, 72_000],
    });

    expect(parseYahooClose(data, (SESSION_END + 60) * 1_000)).toEqual({
      priceKrw: 72_000,
    });
  });

  it("정규장 종료 직후에는 아직 당일 봉을 확정하지 않는다", () => {
    const data = createChartResponse({
      timestamps: [500, SESSION_START],
      closes: [71_000, 72_000],
    });

    expect(parseYahooClose(data, SESSION_END * 1_000)).toEqual({
      priceKrw: 71_000,
    });
  });

  it("완료된 일봉이 없으면 실시간 가격이 아닌 previousClose만 사용한다", () => {
    const data = createChartResponse({
      timestamps: [SESSION_START],
      closes: [72_000],
      previousClose: 71_000,
    });

    data.chart!.result![0]!.meta!.regularMarketPrice = 72_500;

    expect(parseYahooClose(data, 1_500_000)).toEqual({ priceKrw: 71_000 });
  });
});
