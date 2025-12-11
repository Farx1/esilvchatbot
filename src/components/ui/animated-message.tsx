'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Bot, User, ThumbsUp, ThumbsDown, Copy, CheckCircle } from 'lucide-react'

interface AnimatedMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    agentType?: string
    timestamp: Date
  }
  onFeedback?: (messageId: string, feedback: 'up' | 'down') => void
  onCopy?: (content: string) => void
  copiedId?: string
}

export default function AnimatedMessage({ 
  message, 
  onFeedback, 
  onCopy, 
  copiedId 
}: AnimatedMessageProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [userFeedback, setUserFeedback] = useState<'up' | 'down' | null>(null)

  const variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  }

  const getAgentIcon = () => {
    switch (message.agentType) {
      case 'retrieval':
        return <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageSquare className="h-3 w-3 text-blue-600" />
        </div>
      case 'form_filling':
        return <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-3 w-3 text-green-600" />
        </div>
      default:
        return <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
          <Bot className="h-3 w-3 text-purple-600" />
        </div>
    }
  }

  const handleCopy = async () => {
    if (onCopy) {
      await onCopy(message.content)
    }
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
      onMouseEnter={() => setShowFeedback(true)}
      onMouseLeave={() => setShowFeedback(false)}
    >
      {message.role === 'assistant' && (
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {getAgentIcon()}
        </motion.div>
      )}
      
      <motion.div 
        className={`max-w-[80%] relative group ${
          message.role === 'user' 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
            : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
        } rounded-2xl p-4`}
        whileHover={{ 
          scale: 1.02,
          boxShadow: message.role === 'assistant' ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        layout
      >
        {/* Actions buttons */}
        <AnimatePresence>
          {showFeedback && message.role === 'assistant' && (
            <motion.div 
              className="absolute -top-2 -right-2 flex gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCopy}
                className="p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50"
              >
                {copiedId === message.id ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-600" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setUserFeedback('up')
                  onFeedback?.(message.id, 'up')
                }}
                className={`p-1.5 border rounded-full shadow-sm transition-colors ${
                  userFeedback === 'up' 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className="h-3 w-3 text-slate-600" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setUserFeedback('down')
                  onFeedback?.(message.id, 'down')
                }}
                className={`p-1.5 border rounded-full shadow-sm transition-colors ${
                  userFeedback === 'down' 
                    ? 'bg-red-100 border-red-300' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsDown className="h-3 w-3 text-slate-600" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 mb-2">
          {message.role === 'user' && (
            <User className="h-4 w-4 text-blue-100" />
          )}
          <span className="text-xs font-medium opacity-70">
            {message.role === 'user' ? 'Vous' : 'Assistant ESILV'}
          </span>
          {message.agentType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {message.agentType === 'retrieval' ? 'RAG' : 
               message.agentType === 'form_filling' ? 'Formulaire' : 'Orchestration'}
            </span>
          )}
        </div>
        
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
        
        <motion.p 
          className="text-xs opacity-70 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
        >
          {message.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}