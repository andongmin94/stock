"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"

import { matchesAsset } from "../asset-utils"
import type { MarketAsset } from "@/lib/markets/types"

type UseAssetSearchOptions = {
  assets: MarketAsset[]
  excludedSymbols: Set<string>
  onSelectAsset: (symbol: string) => void
}

export function useAssetSearch({
  assets,
  excludedSymbols,
  onSelectAsset,
}: UseAssetSearchOptions) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [addQuery, setAddQuery] = useState("")
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const candidateButtonsRef = useRef(new Map<string, HTMLButtonElement>())
  const hasAddQuery = addQuery.trim().length > 0

  const addCandidates = useMemo(() => {
    if (!hasAddQuery) {
      return []
    }

    return assets
      .filter((asset) => !excludedSymbols.has(asset.symbol))
      .filter((asset) => !asset.isDelisted)
      .filter((asset) => matchesAsset(asset, addQuery))
      .slice(0, 8)
  }, [addQuery, assets, excludedSymbols, hasAddQuery])
  const boundedActiveCandidateIndex =
    addCandidates.length > 0
      ? Math.min(activeCandidateIndex, addCandidates.length - 1)
      : 0

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 60)

    document.body.style.overflow = "hidden"

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen || addCandidates.length === 0) {
      return
    }

    const activeCandidate = addCandidates[boundedActiveCandidateIndex]
    if (!activeCandidate) {
      return
    }

    candidateButtonsRef.current.get(activeCandidate.symbol)?.scrollIntoView({
      block: "nearest",
    })
  }, [addCandidates, boundedActiveCandidateIndex, isSearchOpen])

  const openSearchDialog = () => {
    setIsSearchOpen(true)
    setActiveCandidateIndex(0)
  }

  const closeSearchDialog = () => {
    setIsSearchOpen(false)
    setAddQuery("")
    setActiveCandidateIndex(0)
  }

  const updateAddQuery = (query: string) => {
    setAddQuery(query)
    setActiveCandidateIndex(0)
  }

  const selectAsset = (symbol: string) => {
    onSelectAsset(symbol)
    setAddQuery("")
    setActiveCandidateIndex(0)

    if (isSearchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && addCandidates.length > 0) {
      event.preventDefault()
      setActiveCandidateIndex((current) =>
        current + 1 >= addCandidates.length ? 0 : current + 1
      )
      return
    }

    if (event.key === "ArrowUp" && addCandidates.length > 0) {
      event.preventDefault()
      setActiveCandidateIndex((current) =>
        current - 1 < 0 ? addCandidates.length - 1 : current - 1
      )
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      if (addQuery) {
        setAddQuery("")
        return
      }

      if (isSearchOpen) {
        closeSearchDialog()
      }
      return
    }

    if (
      event.key === "Enter" &&
      !event.nativeEvent.isComposing &&
      addCandidates[boundedActiveCandidateIndex]
    ) {
      event.preventDefault()
      selectAsset(addCandidates[boundedActiveCandidateIndex].symbol)
    }
  }

  return {
    addCandidates,
    addQuery,
    boundedActiveCandidateIndex,
    candidateButtonsRef,
    closeSearchDialog,
    handleSearchKeyDown,
    hasAddQuery,
    isSearchOpen,
    openSearchDialog,
    searchInputRef,
    selectAsset,
    setActiveCandidateIndex,
    updateAddQuery,
  }
}
