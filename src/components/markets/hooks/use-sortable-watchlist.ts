"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

import {
  getDragEndPoint,
  getSortableSymbolFromPoint,
} from "../drag-utils"
import type { MarketAsset } from "@/lib/markets/types"

type UseSortableWatchlistOptions = {
  assetBySymbol: Map<string, MarketAsset>
  setWatchlist: Dispatch<SetStateAction<string[]>>
}

export function useSortableWatchlist({
  assetBySymbol,
  setWatchlist,
}: UseSortableWatchlistOptions) {
  const [activeDragSymbol, setActiveDragSymbol] = useState<string | null>(null)
  const lastPointerPointRef = useRef<{ x: number; y: number } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  const activeDragAsset = useMemo(() => {
    if (!activeDragSymbol) {
      return null
    }

    return assetBySymbol.get(activeDragSymbol) ?? null
  }, [activeDragSymbol, assetBySymbol])

  useEffect(() => {
    const updatePointerPoint = (event: PointerEvent) => {
      lastPointerPointRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
    }

    document.addEventListener("pointerdown", updatePointerPoint, {
      passive: true,
    })
    document.addEventListener("pointermove", updatePointerPoint, {
      passive: true,
    })

    return () => {
      document.removeEventListener("pointerdown", updatePointerPoint)
      document.removeEventListener("pointermove", updatePointerPoint)
    }
  }, [])

  const handleSortStart = (event: DragStartEvent) => {
    setActiveDragSymbol(String(event.active.id))
  }

  const handleSortCancel = () => {
    setActiveDragSymbol(null)
  }

  const handleSortEnd = (event: DragEndEvent) => {
    const activeSymbol = String(event.active.id)
    const dragEndPoint = lastPointerPointRef.current ?? getDragEndPoint(event)
    const directOverSymbol = event.over ? String(event.over.id) : null
    const fallbackOverSymbol = dragEndPoint
      ? getSortableSymbolFromPoint(
          dragEndPoint.x,
          dragEndPoint.y,
          activeSymbol
        )
      : null
    const overSymbol =
      directOverSymbol && directOverSymbol !== activeSymbol
        ? directOverSymbol
        : fallbackOverSymbol

    setActiveDragSymbol(null)

    if (!overSymbol || activeSymbol === overSymbol) {
      return
    }

    setWatchlist((current) => {
      const activeIndex = current.indexOf(activeSymbol)
      const overIndex = current.indexOf(overSymbol)

      if (activeIndex === -1 || overIndex === -1) {
        return current
      }

      return arrayMove(current, activeIndex, overIndex)
    })
  }

  return {
    activeDragAsset,
    activeDragSymbol,
    handleSortCancel,
    handleSortEnd,
    handleSortStart,
    sensors,
  }
}
