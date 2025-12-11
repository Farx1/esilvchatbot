import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ChatOrchestrator as AIChatOrchestrator } from '@/app/api/ai-config/route'

// Agent types
type AgentType = 'retrieval' | 'form_filling' | 'orchestration'

interface ChatRequest {
  message: string
  conversationHistory?: Array<{
    role: string
    content: string
    agentType?: string
  }>
}

class StreamingChatOrchestrator {
  private aiOrchestrator: AIChatOrchestrator

  constructor() {
    this.aiOrchestrator = new AIChatOrchestrator()
  }

  async initialize() {
    await this.aiOrchestrator.initialize()
  }

  async determineAgentType(message: string, conversationHistory: any[] = []): Promise<AgentType> {
    const retrievalKeywords = [
      'majeure', 'spécialisation', 'programme', 'cours', 'admission', 'frais', 'bourse',
      'campus', 'installation', 'localisation', 'logement', 'transport',
      'débouché', 'carrière', 'salaire', 'emploi', 'entreprise', 'stage'
    ]

    const formKeywords = [
      'contact', 'contacter', 'joindre', 'appeler', 'email', 'téléphone',
      'rendez-vous', 'visite', 'inscription', 'postuler', 'candidature'
    ]

    const lowerMessage = message.toLowerCase()

    if (formKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'form_filling'
    }

    if (retrievalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'retrieval'
    }

    return 'orchestration'
  }

  async* streamResponse(message: string, conversationHistory: any[] = [], agentType: AgentType): AsyncGenerator<string> {
    await this.initialize()

    const prompt = this.buildPrompt(message, conversationHistory, agentType)
    
    // Simulate streaming (in real implementation, this would use actual streaming from LLM)
    const response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory.slice(-3))
    
    // Stream the response word by word
    const words = response.split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise(resolve => setTimeout(resolve, 50)) // 50ms delay between words
    }
  }

  private buildPrompt(message: string, conversationHistory: any[], agentType: AgentType): string {
    const context = conversationHistory
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    return `
    Tu es l'assistant ESILV. Réponds UNIQUEMENT en français.
    
    CONTEXTE: ${context}
    QUESTION: "${message}"
    
    Réponds de manière claire et précise en français.
    `
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const orchestrator = new StreamingChatOrchestrator()

  try {
    const body: ChatRequest = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message) {
      return new Response('Message required', { status: 400 })
    }

    const agentType = await orchestrator.determineAgentType(message, conversationHistory)

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send agent type first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'agent', agentType })}\n\n`)
          )

          // Stream the response
          for await (const chunk of orchestrator.streamResponse(message, conversationHistory, agentType)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
            )
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          )

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Stream API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

