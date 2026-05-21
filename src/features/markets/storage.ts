import { DEFAULT_WATCHLIST, WATCHLIST_STORAGE_KEY } from "./constants"

export function loadJsonValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback
  }

  const saved = window.localStorage.getItem(key)

  if (!saved) {
    return fallback
  }

  try {
    return JSON.parse(saved) as T
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

export function loadSavedWatchlist() {
  const savedWatchlist = loadJsonValue<string[] | null>(
    WATCHLIST_STORAGE_KEY,
    null
  )

  return Array.isArray(savedWatchlist) && savedWatchlist.length > 0
    ? savedWatchlist
    : DEFAULT_WATCHLIST
}
