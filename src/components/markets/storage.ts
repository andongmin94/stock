import {
  DEFAULT_WATCHLIST,
  VIEW_MODE_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY,
} from "./constants"
import type { ViewMode } from "@/lib/markets/types"

function loadJsonValue<T>(key: string, fallback: T): T {
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
  const savedWatchlist = loadJsonValue<unknown>(
    WATCHLIST_STORAGE_KEY,
    null
  )

  if (!Array.isArray(savedWatchlist)) {
    return DEFAULT_WATCHLIST
  }

  const validWatchlist = Array.from(
    new Set(
      savedWatchlist.filter(
        (symbol): symbol is string =>
          typeof symbol === "string" && symbol.length > 0
      )
    )
  )

  return validWatchlist.length > 0 ? validWatchlist : DEFAULT_WATCHLIST
}

export function loadSavedViewMode(): ViewMode {
  const savedViewMode = loadJsonValue<unknown>(VIEW_MODE_STORAGE_KEY, "regular")

  return savedViewMode === "compact" || savedViewMode === "regular"
    ? savedViewMode
    : "regular"
}
