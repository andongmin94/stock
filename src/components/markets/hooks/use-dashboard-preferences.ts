"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  DEFAULT_WATCHLIST,
  THEME_STORAGE_KEY,
  VIEW_MODE_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY,
} from "../constants";
import { loadSavedWatchlist, loadSavedViewMode } from "../storage";
import type { ViewMode } from "@/lib/markets/types";

const THEME_SWITCH_CLASS = "theme-switching";
const THEME_REVEAL_CLASS = "theme-reveal-running";
const THEME_SWITCH_SUPPRESS_MS = 140;
const THEME_REVEAL_SETTLE_MS = 620;

type ThemeTransitionOrigin = {
  x: number;
  y: number;
};

type ViewTransition = {
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

export function useDashboardPreferences() {
  const [isDark, setIsDark] = useState(false);
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("regular");
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const isDarkRef = useRef(false);
  const themeSwitchTimerRef = useRef<number | null>(null);
  const themeSwitchTokenRef = useRef(0);

  const commitTheme = useCallback((nextIsDark: boolean) => {
    isDarkRef.current = nextIsDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      nextIsDark ? "dark" : "light",
    );
    setIsDark(nextIsDark);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const nextIsDark =
        savedTheme === "dark" ||
        (savedTheme !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      commitTheme(nextIsDark);
      setHasLoadedTheme(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [commitTheme]);

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

    isDarkRef.current = isDark;
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [hasLoadedTheme, isDark]);

  useEffect(() => {
    return () => {
      if (themeSwitchTimerRef.current !== null) {
        window.clearTimeout(themeSwitchTimerRef.current);
      }

      themeSwitchTokenRef.current += 1;
      document.documentElement.classList.remove(
        THEME_SWITCH_CLASS,
        THEME_REVEAL_CLASS,
      );
      document.documentElement.style.removeProperty("--theme-reveal-x");
      document.documentElement.style.removeProperty("--theme-reveal-y");
      document.documentElement.style.removeProperty("--theme-reveal-radius");
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

  const prepareThemeTransition = useCallback(
    (origin?: ThemeTransitionOrigin, durationMs = THEME_SWITCH_SUPPRESS_MS) => {
      const root = document.documentElement;
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const radius = Math.ceil(
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y),
        ),
      );
      let isFinished = false;
      const transitionToken = themeSwitchTokenRef.current + 1;
      themeSwitchTokenRef.current = transitionToken;

      if (themeSwitchTimerRef.current !== null) {
        window.clearTimeout(themeSwitchTimerRef.current);
      }

      root.style.setProperty("--theme-reveal-x", `${x}px`);
      root.style.setProperty("--theme-reveal-y", `${y}px`);
      root.style.setProperty("--theme-reveal-radius", `${radius}px`);
      root.classList.add(THEME_SWITCH_CLASS, THEME_REVEAL_CLASS);

      const finish = () => {
        if (isFinished || transitionToken !== themeSwitchTokenRef.current) {
          return;
        }

        isFinished = true;

        if (themeSwitchTimerRef.current !== null) {
          window.clearTimeout(themeSwitchTimerRef.current);
          themeSwitchTimerRef.current = null;
        }

        root.classList.remove(THEME_SWITCH_CLASS, THEME_REVEAL_CLASS);
        root.style.removeProperty("--theme-reveal-x");
        root.style.removeProperty("--theme-reveal-y");
        root.style.removeProperty("--theme-reveal-radius");
      };

      themeSwitchTimerRef.current = window.setTimeout(finish, durationMs);

      return finish;
    },
    [],
  );

  const toggleTheme = useCallback(
    (origin?: ThemeTransitionOrigin) => {
      const nextIsDark = !isDarkRef.current;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const finishThemeTransition = prepareThemeTransition(
        origin,
        prefersReducedMotion
          ? THEME_SWITCH_SUPPRESS_MS
          : THEME_REVEAL_SETTLE_MS,
      );
      const startViewTransition = (document as ViewTransitionDocument)
        .startViewTransition;

      if (startViewTransition && !prefersReducedMotion) {
        const transition = startViewTransition.call(document, () => {
          flushSync(() => commitTheme(nextIsDark));
        });

        void transition.finished.finally(finishThemeTransition);
        return;
      }

      commitTheme(nextIsDark);
    },
    [commitTheme, prepareThemeTransition],
  );

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
