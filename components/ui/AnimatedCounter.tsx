'use client'

import { useEffect, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  formatter?: (val: number) => string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1000,
  formatter,
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number
    const startValue = 0

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(startValue + (value - startValue) * ease)
      
      setDisplayValue(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString('fr-FR')

  return (
    <span className={`inline-block font-bold tracking-tight transition-all duration-300 ${className}`}>
      {formatted}
      {suffix && <span className="ml-1 text-sm font-semibold opacity-80">{suffix}</span>}
    </span>
  )
}
