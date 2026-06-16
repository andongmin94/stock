"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_WATCHLIST,
  THEME_STORAGE_KEY,
  VIEW_MODE_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY,
} from "../constants";
import { loadSavedWatchlist, loadSavedViewMode } from "../storage";
import type { ViewMode } from "@/lib/markets/types";

const THEME_SWITCH_CLASS = "theme-switching";
const THEME_SWITCH_SUPPRESS_MS = 140;

export function useDashboardPreferences() {
  const [isDark, setIsDark] = useState(false);
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("regular");
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const themeSwitchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const nextIsDark =
        savedTheme === "dark" ||
        (savedTheme !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      setIsDark(nextIsDark);
      setHasLoadedTheme(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setViewMode(loadSavedViewMode());
      setWatchlist(loadSavedWatchlist());
      setHasLoadedLocalState(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedTheme) {
      return;
    }

    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [hasLoadedTheme, isDark]);

  useEffect(() => {
    return () => {
      if (themeSwitchTimerRef.current !== null) {
        window.clearTimeout(themeSwitchTimerRef.current);
      }

      document.documentElement.classList.remove(THEME_SWITCH_CLASS);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalState) {
      return;
    }

    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify(watchlist),
    );
    window.localStorage.setItem(
      VIEW_MODE_STORAGE_KEY,
      JSON.stringify(viewMode),
    );
  }, [hasLoadedLocalState, viewMode, watchlist]);

  const suppressThemeSurfaceTransitions = useCallback(() => {
    document.documentElement.classList.add(THEME_SWITCH_CLASS);

    if (themeSwitchTimerRef.current !== null) {
      window.clearTimeout(themeSwitchTimerRef.current);
    }

    themeSwitchTimerRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove(THEME_SWITCH_CLASS);
      themeSwitchTimerRef.current = null;
    }, THEME_SWITCH_SUPPRESS_MS);
  }, []);

  const toggleTheme = useCallback(() => {
    suppressThemeSurfaceTransitions();
    setIsDark((current) => !current);
  }, [suppressThemeSurfaceTransitions]);

  const toggleViewMode = useCallback(() => {
    setViewMode((current) => (current === "compact" ? "regular" : "compact"));
  }, []);

  return {
    setWatchlist,
    toggleTheme,
    toggleViewMode,
    viewMode,
    watchlist,
  };
}
