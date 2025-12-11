'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, GraduationCap, FileText, BarChart3, Sparkles, Zap, Shield, ThumbsUp, ThumbsDown, UserCircle } from 'lucide-react'
import { Timestamp } from '@/components/Timestamp'
import { SessionManager } from '@/lib/session'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentType?: string
  timestamp: Date
  feedback?: 'positive' | 'negative' | 'neutral' | null
}

export default function EnhancedESILVChatbot() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const [userId, setUserId] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Bonjour ! Je suis votre assistant ESILV. Je peux vous aider avec :\n\n🎓 Les programmes et spécialisations\n📋 Le processus d\'admission\n🏠 Le campus et la vie étudiante\n💼 Les débouchés professionnels\n\nPosez-moi votre première question !',
      agentType: 'orchestration',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState([
    "Quels sont les programmes disponibles ?",
    "Comment postuler à ESILV ?", 
    "Quelles sont les spécialités en 5ème année ?",
    "Y a-t-il des alternances ?"
  ])
  const [feedbackStates, setFeedbackStates] = useState<Record<string, 'up' | 'down' | null>>({})

  // Initialiser l'utilisateur et la session
  useEffect(() => {
    const userInfo = SessionManager.getUserId()
    const sessInfo = SessionManager.getSessionId()
    setUserId(userInfo)
    setSessionId(sessInfo)
    console.log('👤 User ID:', userInfo)
    console.log('🔑 Session ID:', sessInfo)
  }, [])

  // Auto-scroll vers le bas quand un nouveau message arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    setFeedbackStates(prev => ({ ...prev, [messageId]: feedback }))
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback })
      })
      
      if (response.ok) {
        console.log(`✅ Feedback enregistré: ${messageId} -> ${feedback}`)
        
        // Update the message in state with feedback
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, feedback: feedback === 'up' ? 'positive' : 'negative' }
            : msg
        ))
      } else {
        console.error('Erreur lors de l\'enregistrement du feedback')
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du feedback:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessageId = Date.now().toString()
    const assistantMessageId = (Date.now() + 1).toString()

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)

    // Create placeholder for streaming message
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      agentType: 'orchestration',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: messages.slice(-10),
          messageId: userMessageId,
          assistantMessageId: assistantMessageId,
          userId: userId,
          sessionId: sessionId
        })
      })

      const data = await response.json()

      // Simulate streaming effect by revealing text progressively
      const fullText = data.response
      let currentIndex = 0
      
      const streamInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          const chunkSize = Math.min(3, fullText.length - currentIndex) // 3 caractères à la fois
          currentIndex += chunkSize
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullText.substring(0, currentIndex), agentType: data.agentType }
              : msg
          ))
        } else {
          clearInterval(streamInterval)
          setIsLoading(false)
          updateSuggestions(userInput)
        }
      }, 30) // 30ms entre chaque chunk

    } catch (error) {
      console.error('Error:', error)
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: '⚠️ Désolé, je rencontre des difficultés techniques. Veuillez réessayer.' }
          : msg
      ))
      setIsLoading(false)
    }
  }

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const updateSuggestions = (lastMessage: string) => {
    const newSuggestions = [
      "Pouvez-vous me donner plus de détails ?",
      "Quels sont les prérequis ?",
      "Comment puis-je contacter l'école ?",
      "Y a-t-il des journées portes ouvertes ?"
    ]
    setSuggestions(newSuggestions)
  }

  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'retrieval':
        return <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      case 'form_filling':
        return <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <Shield className="h-4 w-4 text-white" />
        </div>
      default:
        return <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
    }
  }

  const getAgentBadge = (agentType?: string) => {
    switch (agentType) {
      case 'retrieval':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔍 RAG</Badge>
      case 'form_filling':
        return <Badge className="bg-green-100 text-green-800 border-green-200">📝 Formulaire</Badge>
      case 'orchestration':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">🎯 Orchestration</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto p-4">
        {/* Enhanced Header */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <GraduationCap className="h-10 w-10 text-blue-600" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ESILV Smart Assistant
                </h1>
                <p className="text-slate-600 text-sm">Votre assistant intelligent IA pour l'école d'ingénieurs</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {/* User Info Badge */}
              {userId && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <UserCircle className="h-4 w-4 text-blue-600" />
                  <div className="text-xs">
                    <p className="font-semibold text-blue-900">
                      User: {userId.split('-')[1]?.substring(0, 6)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Créer une nouvelle session utilisateur ?')) {
                        SessionManager.resetUser()
                        window.location.reload()
                      }
                    }}
                    className="h-6 px-2 text-xs"
                    title="Nouvelle session"
                  >
                    Nouveau
                  </Button>
                </div>
              )}
              
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('Analytics button clicked')
                  router.push('/admin/analytics')
                }}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('RAG Viewer button clicked')
                  router.push('/rag-viewer')
                }}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  RAG Viewer
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Chat Card */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ pulse: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </motion.div>
                <span className="font-medium">En ligne - Prêt à vous aider</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Zap className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="h-[500px] p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <motion.div 
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {getAgentIcon(message.agentType)}
                      </motion.div>
                    )}
                    
                    <motion.div 
                      className={`max-w-[80%] relative group ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                          : 'bg-slate-50 border border-slate-200 text-slate-900'
                      } rounded-2xl p-4 shadow-sm`}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: message.role === 'assistant' ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none'
                      }}
                    >
                      {/* Feedback buttons - Only show on completed messages (not streaming or initial message) */}
                      {message.role === 'assistant' && message.id !== '1' && !message.isStreaming && (
                        <motion.div 
                          className="absolute -top-2 -right-2 flex gap-1 transition-all"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(message.content, message.id)}
                            className="p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50"
                            title="Copier"
                          >
                            {copiedId === message.id ? (
                              <div className="text-green-600">✓</div>
                            ) : (
                              <div className="text-slate-600">📋</div>
                            )}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleFeedback(message.id, 'up')}
                            className={`p-1.5 border rounded-full shadow-sm transition-colors ${
                              feedbackStates[message.id] === 'up' 
                                ? 'bg-green-100 border-green-300' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                            title="Utile"
                          >
                            <div className="text-slate-600">👍</div>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleFeedback(message.id, 'down')}
                            className={`p-1.5 border rounded-full shadow-sm transition-colors ${
                              feedbackStates[message.id] === 'down' 
                                ? 'bg-red-100 border-red-300' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                            title="Pas utile"
                          >
                            <div className="text-slate-600">👎</div>
                          </motion.button>
                        </motion.div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        {message.role === 'user' && (
                          <User className="h-4 w-4 text-blue-100" />
                        )}
                        <span className="text-xs font-medium opacity-70">
                          {message.role === 'user' ? 'Vous' : 'Assistant ESILV'}
                        </span>
                        {getAgentBadge(message.agentType)}
                      </div>
                      
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      
                      <p className="text-xs opacity-70 mt-2">
                        <Timestamp timestamp={message.timestamp} />
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Marqueur invisible pour le scroll automatique */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestions */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm rounded-full border border-slate-200 transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tapez votre question ici..."
                className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Powered by Multi-Agent AI • Réponses en temps réel
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-6 text-slate-600 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p>Jules Sayad-Barth - DIA5 ESILV 2025</p>
          <p className="mt-1">Assistant intelligent avec technologie Multi-Agent & RAG</p>
        </motion.div>
      </div>
    </div>
  )
}