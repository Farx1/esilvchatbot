'use client'

import { useState, useEffect } from 'react'

interface TimestampProps {
  timestamp: Date
}

export function Timestamp({ timestamp }: TimestampProps) {
  const [isClient, setIsClient] = useState(false)
  const [timeString, setTimeString] = useState('')

  useEffect(() => {
    setIsClient(true)
    setTimeString(timestamp.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }))
  }, [timestamp])

  // Render a placeholder on server, actual time on client
  return (
    <span suppressHydrationWarning>
      {isClient ? timeString : '--:--'}
    </span>
  )
}