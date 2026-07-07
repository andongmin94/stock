import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_WATCHLIST, WATCHLIST_STORAGE_KEY } from "./constants";
import { loadSavedWatchlist } from "./storage";

function createLocalStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

describe("loadSavedWatchlist", () => {
  let localStorage: ReturnType<typeof createLocalStorage>;

  beforeEach(() => {
    localStorage = createLocalStorage();
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("저장된 빈 목록을 유효한 사용자 설정으로 유지한다", () => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, "[]");

    expect(loadSavedWatchlist()).toEqual([]);
  });

  it("중복 종목을 처음 저장된 순서대로 제거한다", () => {
    localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify(["xyz:SMSN", "xyz:SMSN", "xyz:SKHX"]),
    );

    expect(loadSavedWatchlist()).toEqual(["xyz:SMSN", "xyz:SKHX"]);
  });

  it("손상된 저장값은 제거하고 기본 목록을 반환한다", () => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, "{");

    expect(loadSavedWatchlist()).toEqual(DEFAULT_WATCHLIST);
    expect(localStorage.removeItem).toHaveBeenCalledWith(WATCHLIST_STORAGE_KEY);
  });
});
