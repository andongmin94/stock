export const WATCHLIST_STORAGE_KEY = "hl-kr-watchlist-v2"
export const THEME_STORAGE_KEY = "hl-kr-theme"
export const VIEW_MODE_STORAGE_KEY = "hl-kr-view-mode"

export const DEFAULT_WATCHLIST = [
  "xyz:SMSN",
  "xyz:SKHX",
]

export const AUTO_REFRESH_INTERVAL_MS = 5_000
export const MONEY_ANIMATION_MS = 650
export const CARD_ADD_ANIMATION_MS = 560
export const DATA_STALE_MS = 30_000

export const categoryTone: Record<string, string> = {
  주식: "text-[#1267f4]",
  지수: "text-[#5364e8]",
  원자재: "text-[#a76614]",
  FX: "text-[#0f766e]",
  비상장: "text-[#7b52d4]",
  크립토: "text-[#0e7490]",
  기타: "text-[#6f7c8d]",
}
