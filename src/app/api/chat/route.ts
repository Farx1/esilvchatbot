import { NextRequest, NextResponse } from 'next/server'
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
  messageId?: string
  assistantMessageId?: string
  userId?: string
  sessionId?: string
}

interface ChatResponse {
  response: string
  agentType: AgentType
  showForm?: boolean
  isStreaming?: boolean
  ragSources?: Array<{
    question: string
    answer: string
    category: string
  }>
  userMessageId?: string
  assistantMessageId?: string
}

// Enhanced Chat Orchestrator with memory and context awareness
class ChatOrchestrator {
  private aiOrchestrator: AIChatOrchestrator

  constructor() {
    this.aiOrchestrator = new AIChatOrchestrator()
  }

  async initialize() {
    // AI Orchestrator is already initialized
  }

  // Enhanced agent determination with context awareness
  async determineAgentType(message: string, conversationHistory: any[] = []): Promise<AgentType> {
    await this.initialize()

    // Check if this is a follow-up question
    const isFollowUp = conversationHistory.length > 1
    
    // Keywords for different agent types
    const retrievalKeywords = [
      'majeure', 'spécialisation', 'programme', 'cours', 'admission', 'frais', 'bourse',
      'campus', 'installation', 'localisation', 'logement', 'transport',
      'débouché', 'carrière', 'salaire', 'emploi', 'entreprise', 'stage',
      'technologie', 'équipement', 'lab', 'laboratoire'
    ]
    
    const formFillingKeywords = [
      'inscrire', 'candidature', 'postuler', 'contact', 'coordonnées', 'téléphone',
      'email', 'adresse', 'nom', 'prénom', 'information', 'formulaire'
    ]
    
    const lowerMessage = message.toLowerCase()
    
    // Check for form filling intent
    if (formFillingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'form_filling'
    }
    
    // Check for retrieval intent (ESILV-specific knowledge)
    if (retrievalKeywords.some(keyword => lowerMessage.includes(keyword)) || 
        lowerMessage.includes('esilv') || 
        lowerMessage.includes('école') ||
        isFollowUp) {
      return 'retrieval'
    }
    
    // Default to orchestration for general conversation
    return 'orchestration'
  }

  // Enhanced retrieval with better ESILV knowledge
  async handleRetrieval(message: string, conversationHistory: any[] = []): Promise<{ response: string; agentType: AgentType }> {
    await this.initialize()

    // Build context from conversation history (limité pour éviter un contexte trop long)
    const context = conversationHistory
      .slice(-2) // Réduit de 3 à 2 messages pour limiter la taille
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    // Search knowledge base with enhanced matching
    const { results: knowledgeResults, sources } = await this.searchKnowledgeBase(message)
    
    // Also search web for latest ESILV information
    const webResults = await this.searchWebESILV(message)
    
    const prompt = `
    ⚠️ INSTRUCTION CRITIQUE : TU DOIS RÉPONDRE UNIQUEMENT EN FRANÇAIS. Ne réponds jamais en anglais, même si le contexte contient de l'anglais.
    
    Tu es l'assistant ESILV expert. Tu réponds EXCLUSIVEMENT en français de manière précise et professionnelle.
    
    CONTEXTE DE LA CONVERSATION (derniers échanges):
    ${context}
    
    QUESTION UTILISATEUR: "${message}"
    
    INFORMATIONS DE LA BASE DE CONNAISSANCES ESILV:
    ${knowledgeResults}
    
    RÉSULTATS DE RECHERCHE WEB ESILV:
    ${webResults}
    
    INSTRUCTIONS IMPORTANTES:
    1. ⚠️ RÉPONDS UNIQUEMENT EN FRANÇAIS - C'est une règle absolue
    2. Utilise les informations les plus récentes et précises disponibles
    3. Si les informations sont contradictoires, donne la priorité aux plus récentes
    4. Sois cohérent avec les réponses précédentes
    5. Pour les majeures, utilise les informations mises à jour
    6. Si tu n'as pas d'information spécifique, sois honnête et propose des alternatives
    7. Structure ta réponse de manière claire avec des listes ou des paragraphes bien organisés
    8. Termine par une question ouverte pour encourager la conversation
    9. Adapte ton ton au contexte (étudiant potentiel, parent, professionnel, etc.)
    `

    try {
      console.log('\n🔍 RECHERCHE RAG - Résultats trouvés:')
      console.log(knowledgeResults.substring(0, 300) + '...\n')
      
      const response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      return {
        response: response || 'Désolé, je ne peux pas répondre à cette question pour le moment.',
        agentType: 'retrieval',
        ragSources: sources
      }
    } catch (error) {
      console.error('Error in retrieval agent:', error)
      return {
        response: 'Je rencontre des difficultés techniques. Veuillez réessayer plus tard.',
        agentType: 'retrieval',
        ragSources: []
      }
    }
  }

  // Enhanced form filling agent
  async handleFormFilling(message: string, conversationHistory: any[] = []): Promise<{ response: string; agentType: AgentType; showForm: boolean }> {
    await this.initialize()

    const prompt = `
    ⚠️ INSTRUCTION CRITIQUE : TU DOIS RÉPONDRE UNIQUEMENT EN FRANÇAIS. Ne réponds jamais en anglais.
    
    Tu es l'assistant ESILV spécialisé dans la collecte d'informations. L'utilisateur veut: "${message}"
    
    Réponds EXCLUSIVEMENT en français de manière professionnelle et guide-le dans le processus.
    
    INSTRUCTIONS:
    1. ⚠️ RÉPONDS UNIQUEMENT EN FRANÇAIS - C'est une règle absolue
    2. Confirme la demande de l'utilisateur
    3. Explique les prochaines étapes
    4. Demande les informations nécessaires de manière claire
    5. Sois rassurant et professionnel
    6. Indique que ces informations seront utilisées pour le contacter
    7. Termine par une proposition d'aide supplémentaire
    `

    try {
      const response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      return {
        response: response || 'Je vais recueillir vos coordonnées pour vous contacter.',
        agentType: 'form_filling',
        showForm: true
      }
    } catch (error) {
      console.error('Error in form filling agent:', error)
      return {
        response: 'Je vais recueillir vos coordonnées pour que notre équipe puisse vous contacter.',
        agentType: 'form_filling',
        showForm: true
      }
    }
  }

  // Enhanced orchestration agent with memory
  async handleOrchestration(message: string, conversationHistory: any[] = []): Promise<{ response: string; agentType: AgentType }> {
    await this.initialize()

    // Build conversation context (limité pour éviter un contexte trop long)
    const context = conversationHistory
      .slice(-3) // Réduit de 5 à 3 messages pour limiter la taille
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    const prompt = `
    ⚠️ INSTRUCTION CRITIQUE : TU DOIS RÉPONDRE UNIQUEMENT EN FRANÇAIS. Ne réponds jamais en anglais, même si le contexte contient de l'anglais.
    
    Tu es l'assistant conversationnel ESILV. Tu es intelligent, professionnel et amical. Tu réponds EXCLUSIVEMENT en français.
    
    CONTEXTE DE LA CONVERSATION (derniers échanges):
    ${context}
    
    DERNIER MESSAGE UTILISATEUR: "${message}"
    
    TON PERSONNALITÉ:
    - Expert en écoles d'ingénieurs françaises
    - Connaît parfaitement ESILV et ses programmes
    - Capable de comprendre les nuances et les sous-entendus
    - Adapte ton langage au contexte (étudiant, parent, professionnel, etc.)
    - Utilise un ton engageant mais professionnel
    - Pose des questions pertinentes pour mieux comprendre les besoins
    
    COMPÉTENCES:
    - Réponds aux questions sur ESILV
    - Guide vers les ressources appropriées
    - Maintiens une conversation cohérente
    - Donne des exemples concrets quand c'est pertinent
    - Suggère des actions ou prochaines étapes
    
    RÈGLES ABSOLUES:
    1. ⚠️ RÉPONDS UNIQUEMENT EN FRANÇAIS - C'est une règle absolue, jamais d'anglais
    2. Sois cohérent avec les réponses précédentes
    3. N'invente pas d'informations que tu n'as pas
    4. Si tu ne sais pas, dis-le honnêtement
    5. Adapte ton niveau de langage et de détail
    6. Termine par une question ouverte ou une proposition d'aide
    
    Réponds de manière naturelle et conversationnelle EN FRANÇAIS.
    `

    try {
      const response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      return {
        response: response || 'Comment puis-je vous aider concernant ESILV ?',
        agentType: 'orchestration'
      }
    } catch (error) {
      console.error('Error in orchestration agent:', error)
      return {
        response: 'Je suis là pour vous aider avec des informations sur ESILV. Que souhaitez-vous savoir ?',
        agentType: 'orchestration'
      }
    }
  }

  // Enhanced knowledge base search with context size limit and better keyword extraction
  private async searchKnowledgeBase(query: string): Promise<{ results: string; sources: Array<{ question: string; answer: string; category: string }> }> {
    try {
      // Extraire les mots-clés pertinents de la requête
      const keywords = this.extractKeywords(query)
      
      // Construire les conditions de recherche pour chaque mot-clé
      // Note: SQLite ne supporte pas 'mode: insensitive', on utilise toLowerCase() à la place
      const lowerKeywords = keywords.map(k => k.toLowerCase())
      const searchConditions = lowerKeywords.flatMap(keyword => [
        { question: { contains: keyword } },
        { answer: { contains: keyword } },
        { category: { contains: keyword } }
      ])
      
      const results = await db.knowledgeBase.findMany({
        where: {
          OR: searchConditions
        },
        orderBy: [
          { confidence: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 3 // Réduit de 5 à 3 pour limiter la taille du contexte
      })

      if (results.length === 0) {
        return {
          results: "Aucune information spécifique trouvée dans notre base de connaissances.",
          sources: []
        }
      }

      // Limiter la taille de chaque réponse pour éviter un contexte trop long
      const maxAnswerLength = 500 // Limite à 500 caractères par réponse
      const formattedResults = results.map(r => {
        const truncatedAnswer = r.answer.length > maxAnswerLength 
          ? r.answer.substring(0, maxAnswerLength) + '...' 
          : r.answer
        return `Q: ${r.question}\nR: ${truncatedAnswer}`
      }).join('\n\n')

      const sources = results.map(r => ({
        question: r.question,
        answer: r.answer,
        category: r.category
      }))

      return { results: formattedResults, sources }
    } catch (error) {
      console.error('Error searching knowledge base:', error)
      return { results: '', sources: [] }
    }
  }

  // Extraire les mots-clés pertinents d'une requête
  private extractKeywords(query: string): string[] {
    // Mots vides à ignorer
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux', 'et', 'ou', 'est', 'sont', 'quoi', 'quel', 'quelle', 'quels', 'quelles', 'comment', 'où', 'qui', 'que', 'quand', 'pourquoi', 'l', 'd']
    
    // Normaliser et diviser la requête
    const words = query.toLowerCase()
      .replace(/[?!.,;:]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
    
    // Ajouter des variantes (singulier/pluriel)
    const keywords = new Set<string>()
    words.forEach(word => {
      keywords.add(word)
      // Ajouter la forme singulière si c'est un pluriel
      if (word.endsWith('s') && word.length > 3) {
        keywords.add(word.slice(0, -1))
      }
      // Ajouter la forme plurielle si c'est un singulier
      if (!word.endsWith('s')) {
        keywords.add(word + 's')
      }
    })
    
    return Array.from(keywords)
  }

  // Enhanced ESILV-specific web search
  private async searchWebESILV(query: string): Promise<string> {
    try {
      // Simple web search fallback - can be enhanced later
      // For now, return empty as web search requires external services
      return ''
    } catch (error) {
      console.error('Error searching web:', error)
      return ''
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, conversationHistory = [], messageId, assistantMessageId, userId, sessionId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const orchestrator = new ChatOrchestrator()
    const agentType = await orchestrator.determineAgentType(message, conversationHistory)

    let response: ChatResponse

    switch (agentType) {
      case 'retrieval':
        response = await orchestrator.handleRetrieval(message, conversationHistory)
        break
      case 'form_filling':
        response = await orchestrator.handleFormFilling(message, conversationHistory)
        break
      case 'orchestration':
      default:
        response = await orchestrator.handleOrchestration(message, conversationHistory)
        break
    }

    // Save conversation to database with provided IDs and user info
    const savedIds = await saveConversation(
      message, 
      response, 
      messageId, 
      assistantMessageId,
      userId,
      sessionId
    )
    
    // Add the real database IDs to the response
    return NextResponse.json({
      ...response,
      userMessageId: savedIds.userMessageId,
      assistantMessageId: savedIds.assistantMessageId
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function saveConversation(
  userMessage: string, 
  assistantResponse: ChatResponse,
  userMessageId?: string,
  assistantMessageId?: string,
  userId?: string,
  sessionId?: string
): Promise<{ userMessageId: string; assistantMessageId: string }> {
  try {
    // Use provided sessionId or default
    const finalSessionId = sessionId || 'default'
    const finalUserId = userId || null
    
    // Create or get conversation for this user/session
    let conversation = await db.conversation.findFirst({
      where: { 
        sessionId: finalSessionId,
        userId: finalUserId 
      }
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { 
          sessionId: finalSessionId,
          userId: finalUserId
        }
      })
      console.log(`✨ Nouvelle conversation créée pour user: ${finalUserId}, session: ${finalSessionId}`)
    }

    // Save user message with provided ID
    const savedUserMessage = await db.message.create({
      data: {
        id: userMessageId, // Use the provided ID from frontend
        conversationId: conversation.id,
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }
    })

    // Save assistant response with provided ID
    const savedAssistantMessage = await db.message.create({
      data: {
        id: assistantMessageId, // Use the provided ID from frontend
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantResponse.response,
        agentType: assistantResponse.agentType,
        timestamp: new Date()
      }
    })

    console.log(`✅ Conversation saved: user=${savedUserMessage.id}, assistant=${savedAssistantMessage.id}`)
    
    return {
      userMessageId: savedUserMessage.id,
      assistantMessageId: savedAssistantMessage.id
    }
  } catch (error) {
    console.error('Error saving conversation:', error)
    // Return provided IDs on error
    return {
      userMessageId: userMessageId || '',
      assistantMessageId: assistantMessageId || ''
    }
  }
}