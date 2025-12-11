'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface StreamingMessageProps {
  content: string
  isComplete: boolean
}

export function StreamingMessage({ content, isComplete }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content)
      return
    }

    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 20) // 20ms par caractère pour un effet fluide

      return () => clearTimeout(timeout)
    }
  }, [content, currentIndex, isComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="whitespace-pre-wrap"
    >
      {displayedContent}
      {!isComplete && currentIndex < content.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1 h-4 ml-1 bg-primary"
        />
      )}
    </motion.div>
  )
}

