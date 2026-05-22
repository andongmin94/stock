"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { MONEY_ANIMATION_MS } from "../constants"
import { formatKrw } from "../formatters"

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3
}

export function AnimatedKrw({
  value,
  fallback = "-",
}: {
  value: number | null
  fallback?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const displayValueRef = useRef(value)
  const frameRef = useRef<number | null>(null)
  const [movement, setMovement] = useState<"up" | "down" | null>(null)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const fromValue = displayValueRef.current

    if (value === null || fromValue === null || fromValue === value) {
      displayValueRef.current = value
      frameRef.current = window.requestAnimationFrame(() => {
        setDisplayValue(value)
        setMovement(null)
        frameRef.current = null
      })
      return
    }

    const startedAt = performance.now()
    const direction = value > fromValue ? "up" : "down"

    setMovement(direction)
    setAnimationKey((current) => current + 1)

    const tick = (now: number) => {
      const progress = Math.min(
        (now - startedAt) / MONEY_ANIMATION_MS,
        1
      )
      const easedProgress = easeOutCubic(progress)
      const nextValue = fromValue + (value - fromValue) * easedProgress

      displayValueRef.current = nextValue
      setDisplayValue(nextValue)

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick)
        return
      }

      displayValueRef.current = value
      setDisplayValue(value)
      frameRef.current = null
    }

    frameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [value])

  return (
    <span
      key={animationKey}
      className={cn(
        "money-value inline-block tabular-nums",
        movement === "up" && "money-value-up",
        movement === "down" && "money-value-down"
      )}
    >
      {displayValue === null ? fallback : formatKrw(displayValue)}
    </span>
  )
}
