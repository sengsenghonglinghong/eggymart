"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface SaleCountdownProps {
  endDate: string
  className?: string
  showIcon?: boolean
}

export function SaleCountdown({ endDate, className = "", showIcon = true }: SaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const difference = end - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft(null)
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  if (!timeLeft) {
    return null
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0')

  return (
    <div className={`flex items-center gap-1 text-xs font-medium text-red-600 ${className}`}>
      {showIcon && <Clock className="w-3 h-3" />}
      <span className="font-bold">Sale ends in:</span>
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-red-100 px-1.5 py-0.5 rounded text-red-700 font-bold">
              {timeLeft.days}d
            </span>
            <span className="text-red-500">:</span>
          </>
        )}
        <span className="bg-red-100 px-1.5 py-0.5 rounded text-red-700 font-bold">
          {formatTime(timeLeft.hours)}h
        </span>
        <span className="text-red-500">:</span>
        <span className="bg-red-100 px-1.5 py-0.5 rounded text-red-700 font-bold">
          {formatTime(timeLeft.minutes)}m
        </span>
        <span className="text-red-500">:</span>
        <span className="bg-red-100 px-1.5 py-0.5 rounded text-red-700 font-bold">
          {formatTime(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  )
}
