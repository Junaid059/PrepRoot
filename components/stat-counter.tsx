"use client"

import { useState, useEffect, useRef } from "react"

export default function StatCounter({ end, duration = 2, decimals = 0 }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef(null)

  useEffect(() => {
    startTimeRef.current = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smoother animation
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      countRef.current = easedProgress * end
      setCount(countRef.current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    requestAnimationFrame(animate)

    return () => {
      startTimeRef.current = null
    }
  }, [end, duration])

  return Math.round(count).toLocaleString()
}
