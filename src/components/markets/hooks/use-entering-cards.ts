"use client"

import { useEffect, useRef, useState } from "react"

import { CARD_ADD_ANIMATION_MS } from "../constants"

export function useEnteringCards() {
  const [enteringSymbols, setEnteringSymbols] = useState<Set<string>>(
    () => new Set()
  )
  const cardAddTimers = useRef(new Map<string, number>())

  useEffect(() => {
    const timers = cardAddTimers.current

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const markCardEntering = (symbol: string) => {
    setEnteringSymbols((current) => {
      const nextSymbols = new Set(current)
      nextSymbols.add(symbol)
      return nextSymbols
    })

    const currentTimer = cardAddTimers.current.get(symbol)
    if (currentTimer) {
      window.clearTimeout(currentTimer)
    }

    const nextTimer = window.setTimeout(() => {
      setEnteringSymbols((current) => {
        if (!current.has(symbol)) {
          return current
        }

        const nextSymbols = new Set(current)
        nextSymbols.delete(symbol)
        return nextSymbols
      })
      cardAddTimers.current.delete(symbol)
    }, CARD_ADD_ANIMATION_MS + 120)

    cardAddTimers.current.set(symbol, nextTimer)
  }

  const clearEnteringCards = () => {
    setEnteringSymbols(new Set())
    for (const timer of cardAddTimers.current.values()) {
      window.clearTimeout(timer)
    }
    cardAddTimers.current.clear()
  }

  return {
    clearEnteringCards,
    enteringSymbols,
    markCardEntering,
  }
}
