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

    // Détecter si la question nécessite des informations récentes/actuelles
    const needsRecentInfo = /\b(dernier|dernière|derniers|dernières|récent|récente|récents|récentes|nouveau|nouvelle|nouveaux|nouvelles|actualité|actualités|news|à jour|mise à jour|changement|modification)\b/i.test(message)
    
    // Détecter si la question porte sur des INFORMATIONS VARIABLES (personnel, contacts, responsables)
    const needsWebVerification = /\b(responsable|contact|directeur|directrice|chef|manager|personnel|équipe|qui est|téléphone|email|adresse)\b/i.test(message)
    
    // Obtenir la date actuelle pour le contexte
    const currentDate = new Date()
    const dateStr = currentDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    let knowledgeResults = ''
    let sources: any[] = []
    let webResults = ''
    let needsVerification = false

    // TOUJOURS interroger le RAG d'abord (réponse rapide)
    const ragData = await this.searchKnowledgeBase(message)
    knowledgeResults = ragData.results
    sources = ragData.sources

    // Vérifier l'âge des données RAG : si pas vérifié aujourd'hui → lancer vérification
    if (sources.length > 0) {
      const oldestSource = sources[0] // Supposons que searchKnowledgeBase retourne les sources triées
      const lastVerified = oldestSource.lastVerified ? new Date(oldestSource.lastVerified) : new Date(oldestSource.createdAt)
      const daysSinceVerification = Math.floor((currentDate.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceVerification >= 1) {
        needsVerification = true
        console.log(`⚠️ Données RAG âgées de ${daysSinceVerification} jours → Vérification scraper parallèle`)
      } else {
        console.log(`✅ Données vérifiées aujourd'hui → pas de nouvelle vérification nécessaire`)
      }
    } else {
      // Pas de sources → on devra scraper
      needsVerification = true
    }

    const shouldScrape = needsRecentInfo || needsWebVerification || needsVerification || !knowledgeResults || knowledgeResults.trim() === ''
    if (shouldScrape) {
      let reason = 'vérification'
      if (needsRecentInfo) reason = 'actualités'
      else if (needsWebVerification) reason = 'informations variables (personnel/contacts)'
      else if (!knowledgeResults || knowledgeResults.trim() === '') reason = 'fallback (RAG vide)'
      else reason = 'vérification données âgées'
      
      console.log(`🌐 Scraper activé: ${reason}`)
      const includeHtml = true
      
      // Lancer le scraper EN PARALLÈLE si on a déjà des données RAG récentes
      if (knowledgeResults && knowledgeResults.trim() !== '' && needsVerification) {
        console.log('🔄 Scraping en parallèle pour vérification (réponse immédiate maintenue)...')
        this.searchWebESILV(message, currentDate, includeHtml).then(async (webData) => {
          if (webData && webData.trim() !== '') {
            console.log('✅ Scraper terminé - Données web disponibles pour comparaison')
            // TODO: comparer et mettre à jour le RAG automatiquement
          }
        }).catch(err => console.error('❌ Erreur scraper parallèle:', err))
      } else {
        // RAG vide ou question critique → attendre les données web
        webResults = await this.searchWebESILV(message, currentDate, includeHtml)
        console.log(`✅ Scraper terminé: ${reason}`)
        // Dans ce cas, on ignore le RAG pour la réponse
        knowledgeResults = ''
        sources = []
      }
    }
    
    const prompt = `
    ⚠️ INSTRUCTION CRITIQUE : TU DOIS RÉPONDRE UNIQUEMENT EN FRANÇAIS. Ne réponds jamais en anglais, même si le contexte contient de l'anglais.
    
    Tu es l'assistant ESILV expert. Tu réponds EXCLUSIVEMENT en français de manière précise et professionnelle.
    
    📅 DATE ACTUELLE: ${dateStr}
    ⚠️ IMPORTANT: Utilise cette date pour contextualiser les informations "récentes" ou "dernières".
    
    CONTEXTE DE LA CONVERSATION (derniers échanges):
    ${context}
    
    QUESTION UTILISATEUR: "${message}"
    
    ${needsRecentInfo || needsWebVerification ? '🔴 QUESTION NÉCESSITANT DES INFOS À JOUR - UTILISE UNIQUEMENT LES RÉSULTATS WEB CI-DESSOUS' : 'INFORMATIONS DE LA BASE DE CONNAISSANCES ESILV:'}
    ${needsRecentInfo || needsWebVerification ? '' : knowledgeResults}
    
    RÉSULTATS DE RECHERCHE WEB ESILV (INFORMATIONS EN TEMPS RÉEL):
    ${webResults}
    
    INSTRUCTIONS IMPORTANTES:
    1. ⚠️ RÉPONDS UNIQUEMENT EN FRANÇAIS - C'est une règle absolue
    2. ${needsRecentInfo || needsWebVerification ? '🔴 UTILISE UNIQUEMENT les résultats web ci-dessus. Cite les sources EXACTES.' : 'Utilise les informations les plus précises disponibles'}
    3. ${needsRecentInfo ? 'Cite TOUJOURS les dates des actualités (ex: "10 Déc 2025")' : needsWebVerification ? 'Cite TOUJOURS la source de l\'information (ex: "Source: https://www.esilv.fr/...")' : 'Si les informations ont des dates, mentionne-les'}
    4. ${needsRecentInfo ? 'Mentionne les tags/catégories si fournis (ex: hackathon, cybersécurité)' : needsWebVerification ? 'Pour les informations de contact/personnel, vérifie qu\'elles proviennent du site officiel. Si du HTML brut est fourni, analyse-le pour extraire précisément le nom / contact.' : 'Pour les questions sur l\'actualité, cite les dates et sources'}
    5. Sois cohérent avec les réponses précédentes
    6. Structure ta réponse de manière claire avec des listes ou des paragraphes bien organisés
    7. ${needsRecentInfo || needsWebVerification ? 'Cite les sources en fin de réponse (ex: "Source: https://www.esilv.fr/...")' : 'Si tu n\'as pas d\'information spécifique, sois honnête'}
    8. Termine par une question ouverte pour encourager la conversation
    9. Adapte ton ton au contexte (étudiant potentiel, parent, professionnel, etc.)
    ${needsRecentInfo || needsWebVerification ? '10. 🔴 NE PAS inventer d\'informations - utilise UNIQUEMENT celles fournies par le scraper web' : ''}
    `

    try {
      if ((needsRecentInfo || needsWebVerification) && webResults) {
        console.log('\n🌐 SCRAPER WEB - Résultats trouvés:')
        console.log(webResults.substring(0, 300) + '...\n')
      } else {
        console.log('\n🔍 RECHERCHE RAG - Résultats trouvés:')
        console.log(knowledgeResults.substring(0, 300) + '...\n')
      }
      
      const response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      
      // Retourner le bon agentType selon la source utilisée
      const agentType = (needsRecentInfo || needsWebVerification) && webResults ? 'scraper' : 'retrieval'
      
      return {
        response: response || 'Désolé, je ne peux pas répondre à cette question pour le moment.',
        agentType: agentType,
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
  private async searchKnowledgeBase(query: string): Promise<{ results: string; sources: Array<{ question: string; answer: string; category: string; lastVerified?: Date; createdAt: Date }> }> {
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
          { lastVerified: 'desc' }, // Prioriser les données récemment vérifiées
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
        category: r.category,
        lastVerified: r.lastVerified,
        createdAt: r.createdAt
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
  private async searchWebESILV(query: string, currentDate?: Date, includeHtml: boolean = false): Promise<string> {
    try {
      console.log('🌐 Appel du scraper web pour:', query)
      
      // Appeler l'API scraper avec la date et deep scraping activé
      const response = await fetch('http://localhost:3000/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          currentDate: currentDate?.toISOString(),
          deepScrape: true,  // Activer le deep scraping
          autoSave: false,   // Ne pas sauvegarder automatiquement, l'orchestrateur décidera
          includeHtml
        })
      })

      if (!response.ok) {
        console.log('⚠️ Scraper API error:', response.status)
        return ''
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        console.log(`✅ Scraper a trouvé ${data.results.length} résultats (deep scraping)`)
        
        // Décider si les données doivent être ajoutées au RAG
        await this.evaluateAndSaveToRAG(data.results, query)
        
        // Formater les résultats pour le prompt avec dates et contenu complet
        const formattedResults = data.results
          .map((r: any) => {
            let result = `📰 Source: ${r.url}\n📌 Titre: ${r.title}`
            if (r.date) {
              result += `\n📅 Date: ${r.date}`
            }
            if (r.tags && r.tags.length > 0) {
              result += `\n🏷️  Tags: ${r.tags.join(', ')}`
            }
            // Utiliser le contenu complet si disponible
            const content = r.fullContent || r.content
            result += `\n📄 Contenu: ${content}`
            if (includeHtml && r.rawHtml) {
              const htmlSnippet = r.rawHtml.substring(0, 4000)
              result += `\n🧩 HTML_SOURCE (tronqué):\n${htmlSnippet}`
            }
            return result
          })
          .join('\n\n')
        
        return formattedResults
      } else {
        console.log('❌ Scraper n\'a rien trouvé')
        return ''
      }
    } catch (error) {
      console.error('Error searching web:', error)
      return ''
    }
  }

  private async evaluateAndSaveToRAG(scrapedResults: any[], query: string): Promise<void> {
    try {
      console.log('\n🤖 Orchestrateur évalue les données scrapées...')
      
      for (const result of scrapedResults) {
        // Vérifier si l'information existe déjà dans le RAG
        const existing = await db.knowledgeBase.findFirst({
          where: {
            OR: [
              { question: { contains: result.title } },
              { answer: { contains: result.title } }
            ]
          }
        })
        
        if (!existing) {
          // Information nouvelle et pertinente → Sauvegarder dans le RAG
          const contentToSave = result.fullContent || result.content
          const question = `${result.title} (${result.date || 'Date inconnue'})`
          
          let answer = contentToSave
          if (result.tags && result.tags.length > 0) {
            answer += `\n\nTags: ${result.tags.join(', ')}`
          }
          answer += `\n\nSource: ${result.url}`
          
          await db.knowledgeBase.create({
            data: {
              question: question,
              answer: answer,
              category: 'actualités_scrapées',
              confidence: result.confidence || 0.90,
              source: result.url,
              lastVerified: new Date()
            }
          })
          
          console.log(`  ✅ Ajouté au RAG: "${result.title.substring(0, 50)}..."`)
        } else {
          // Mettre à jour la date de vérification pour refléter le contrôle effectué
          await db.knowledgeBase.update({
            where: { id: existing.id },
            data: { lastVerified: new Date() }
          })
          console.log(`  ⏭️  Déjà dans RAG (lastVerified mis à jour): "${result.title.substring(0, 50)}..."`)
        }
      }
      
      console.log('✅ Évaluation terminée\n')
      
    } catch (error) {
      console.error('Error evaluating scraped data:', error)
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