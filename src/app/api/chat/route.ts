import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChatOrchestrator as AIChatOrchestrator } from '@/app/api/ai-config/route'
import { hasKeyword } from '@/lib/keyword-match'

// Agent types
type AgentType = 'retrieval' | 'form_filling' | 'orchestration' | 'scraper'

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
  confidence?: number  // Score de confiance 0-1 calculé dynamiquement
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

  // Calcule le niveau de confiance en fonction de la qualité des sources
  calculateConfidence(
    sources: any[], 
    usedScraper: boolean, 
    dataAge: number = 0
  ): number {
    // Facteurs de confiance
    let confidence = 0.5 // Base confidence
    
    // 1. Nombre de sources trouvées (max +0.3)
    if (sources.length >= 3) {
      confidence += 0.3
    } else if (sources.length === 2) {
      confidence += 0.2
    } else if (sources.length === 1) {
      confidence += 0.1
    }
    
    // 2. Score de pertinence moyen (max +0.25)
    if (sources.length > 0) {
      const avgRelevance = sources.reduce((sum, src) => {
        return sum + (src.relevanceScore || 0)
      }, 0) / sources.length
      
      // Normaliser le score (supposons max 10)
      confidence += (avgRelevance / 10) * 0.25
    }
    
    // 3. Fraîcheur des données (max +0.15)
    if (dataAge === 0) {
      confidence += 0.15 // Données scrapées en temps réel
    } else if (dataAge <= 7) {
      confidence += 0.12 // Moins d'une semaine
    } else if (dataAge <= 30) {
      confidence += 0.08 // Moins d'un mois
    } else if (dataAge <= 90) {
      confidence += 0.04 // Moins de 3 mois
    }
    // Sinon, pas de bonus
    
    // 4. Pénalité si aucun résultat RAG et scraper échoué
    if (sources.length === 0 && !usedScraper) {
      confidence = 0.3 // Très faible confiance
    }
    
    // 5. Bonus si données vérifiées par scraper
    if (usedScraper) {
      confidence += 0.1
    }
    
    // Limiter entre 0 et 1
    return Math.max(0, Math.min(1, confidence))
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
    
    // ESILV knowledge questions win over form intent ("frais d'inscription", "informations sur les cours")
    if (hasKeyword(message, [...retrievalKeywords, 'esilv', 'école'])) {
      return 'retrieval'
    }

    if (hasKeyword(message, formFillingKeywords)) {
      return 'form_filling'
    }

    if (isFollowUp) {
      return 'retrieval'
    }
    
    // Default to orchestration for general conversation
    return 'orchestration'
  }

  // Enhanced retrieval with better ESILV knowledge
  async handleRetrieval(message: string, conversationHistory: any[] = []): Promise<{ response: string; agentType: AgentType; confidence?: number; ragSources?: any[] }> {
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

    // TOUJOURS interroger le RAG d'abord
    const ragData = await this.searchKnowledgeBase(message)
    knowledgeResults = ragData.results
    sources = ragData.sources

    // Vérifier l'âge des données RAG
    if (sources.length > 0) {
      const oldestSource = sources[0] // Supposons que searchKnowledgeBase retourne les sources triées
      const lastVerified = oldestSource.lastVerified ? new Date(oldestSource.lastVerified) : new Date(oldestSource.createdAt)
      const daysSinceVerification = Math.floor((currentDate.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24))
      
      // Règles de vérification basées sur l'âge
      if (daysSinceVerification > 30) {
        needsVerification = true
        console.log(`⚠️ Données RAG anciennes (${daysSinceVerification} jours) → Vérification scraper nécessaire`)
      } else if (daysSinceVerification > 7 && (needsRecentInfo || needsWebVerification)) {
        needsVerification = true
        console.log(`⚠️ Données RAG de ${daysSinceVerification} jours + question sensible → Vérification scraper`)
      } else {
        console.log(`✅ Données RAG récentes (${daysSinceVerification} jours) → Pas de vérification nécessaire`)
      }
    }

    // Activer le scraper si nécessaire
    if (needsRecentInfo || needsWebVerification || needsVerification || !knowledgeResults || knowledgeResults.trim() === '') {
      let reason = 'fallback (RAG vide)'
      if (needsRecentInfo) reason = 'actualités'
      else if (needsWebVerification) reason = 'informations variables (personnel/contacts)'
      else if (needsVerification) reason = 'vérification données anciennes'
      
      console.log(`🌐 Scraper activé: ${reason}`)
      
      // Lancer le scraper EN PARALLÈLE si on a déjà des données RAG
      if (knowledgeResults && knowledgeResults.trim() !== '') {
        console.log('🔄 Scraping en parallèle pour vérification...')
        // Scraper en arrière-plan (ne pas attendre)
        this.searchWebESILV(message, currentDate).then(async (webData) => {
          if (webData && webData.trim() !== '') {
            console.log('✅ Scraper terminé - Comparaison avec RAG...')
            
            // Comparer les données RAG vs Web
            const comparison = this.compareDataSources(
              knowledgeResults,
              webData,
              message
            )
            
            if (comparison.hasConflict) {
              console.log(`⚠️ Conflit détecté (${comparison.confidence}):`, comparison.differences)
              
              // Déclencher la résolution de conflits
              const conflictResolution = await this.detectAndResolveConflicts(
                webData,
                message,
                sources
              )
              
              if (conflictResolution.conflictsFound > 0) {
                console.log(`🔧 ${conflictResolution.conflictsFound} conflits trouvés, ${conflictResolution.entriesToDelete.length} entrées à supprimer`)
                
                // Mettre à jour le RAG automatiquement avec logging
                const updateResult = await this.updateRAGWithWebData(conflictResolution, message)
                console.log(`✅ RAG mis à jour: ${updateResult.deleted} supprimées, ${updateResult.added} ajoutées, ${updateResult.updated} mises à jour`)
                console.log(`📝 Toutes les mises à jour ont été loggées dans RAGUpdate`)
              }
            } else {
              console.log('✅ Données cohérentes, pas de mise à jour nécessaire')
            }
          }
        }).catch(err => console.error('❌ Erreur scraper parallèle:', err))
        
        // Utiliser les données RAG immédiatement (pas d'attente)
        console.log('⚡ Réponse immédiate avec données RAG (scraper en arrière-plan)')
      } else {
        // Pas de données RAG, attendre le scraper
        webResults = await this.searchWebESILV(message, currentDate)
        console.log(`✅ Scraper terminé: ${reason}`)
      }
    }
    
    const prompt = `
    ⚠️ RÈGLE ABSOLUE : RÉPONDS UNIQUEMENT EN FRANÇAIS. Jamais en anglais, quelle que soit la langue de la question ou du contexte.
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    IDENTITÉ
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Tu es l'assistant virtuel officiel de l'ESILV (École Supérieure d'Ingénieurs Léonard-de-Vinci).
    
    ⚠️ IMPORTANT : NE JAMAIS inclure ces lignes de séparation (━━━) dans ta réponse. Elles sont uniquement pour structurer ce prompt.
    
    L'ESILV est une école d'ingénieurs généraliste post-bac, spécialisée dans les technologies numériques,
    située au Pôle Léonard de Vinci à Paris La Défense (avec aussi des campus à Nantes et Montpellier).
    
    📅 Date actuelle: ${dateStr}
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CONTEXTE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Conversation récente:
    ${context}
    
    Question: "${message}"
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    DONNÉES DISPONIBLES
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ${needsRecentInfo || needsWebVerification ? '🔴 INFORMATIONS EN TEMPS RÉEL (Site officiel ESILV):' : 'Base de connaissances ESILV:'}
    ${needsRecentInfo || needsWebVerification ? webResults : knowledgeResults}
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    INSTRUCTIONS DE RÉPONSE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    🎯 RÈGLES FONDAMENTALES:
    
    1. **Langue**: UNIQUEMENT français, ton professionnel mais accessible
    
    2. **Exactitude - RÈGLE CRITIQUE**: 
       ${needsRecentInfo || needsWebVerification ? '🔴 Utilise EXCLUSIVEMENT les informations du scraper web ci-dessus' : '🔴 Utilise EXCLUSIVEMENT les informations de la base de connaissances fournies ci-dessus'}
       
       🚨 INTERDICTIONS ABSOLUES 🚨
       
       Tu es en mode "COPIE STRICTE" : COPIE EXACTEMENT les noms, termes et informations depuis les données fournies.
       
       ⛔ NE JAMAIS:
       - Inventer, halluciner ou extrapoler des informations
       - Utiliser tes connaissances générales sur l'ESILV
       - Mentionner des noms qui ne sont PAS textuellement dans les données (ex: "LéoFly", "DaVinciCode", "BDL")
       - Paraphraser ou "traduire" les noms - COPIE-LES EXACTEMENT
       - Répéter une réponse précédente si la question est différente
       
       ✅ TU DOIS:
       - COPIER mot-à-mot les noms propres (associations, personnes, lieux)
       - Si le texte dit "Leo volley", écris "Leo volley" (pas "LéoFly" !)
       - Si le texte dit "Léo Basket", écris "Léo Basket" (pas autre chose !)
       - Vérifier 2 fois que chaque nom que tu écris est EXACTEMENT dans les données
       
       ✅ SI LES DONNÉES NE RÉPONDENT PAS:
       - Dis : "Je n'ai pas d'information spécifique sur ce sujet dans ma base actuelle."
       - Propose : "Je vous invite à consulter https://www.esilv.fr"
       - N'invente RIEN, même si tu "connais" la réponse
    
    3. **Structure de réponse EN MARKDOWN**:
       ⚠️ IMPORTANT: Ta réponse sera rendue avec un parser Markdown. RESPECTE CES RÈGLES:
       
       - Phrase d'introduction directe (1-2 lignes)
       - Corps structuré avec listes à puces OU paragraphes courts
       - ${needsRecentInfo ? 'Toujours inclure les dates (format: "DD Mmm YYYY")' : 'Inclure les détails pertinents'}
       - ${needsRecentInfo ? 'Mentionner les tags/catégories (ex: hackathon, cybersécurité)' : 'Rester factuel et précis'}
       - Conclusion courte + question ouverte pour continuer la conversation
       
       📝 FORMAT MARKDOWN OBLIGATOIRE - RÈGLE CRITIQUE:
       
       ⚠️ TU DOIS ABSOLUMENT METTRE UN RETOUR À LA LIGNE APRÈS CHAQUE ÉLÉMENT DE LISTE ⚠️
       
       - Titres de section: **Texte en gras:** (avec double astérisque ET deux-points)
       - CHAQUE élément de liste = UNE NOUVELLE LIGNE (appuie sur ENTRÉE après chaque item)
       - Liste à puces: • (bullet) OU - (tiret) au DÉBUT de chaque ligne
       - Ligne vide entre les sections
       
       ❌ INTERDIT - Tout sur une ligne:
       "**Informatique:** • Item 1 • Item 2 • Item 3"
       
       ✅ OBLIGATOIRE - Un item par ligne (avec \n entre chaque):
       "**Informatique:**
       • Item 1
       • Item 2  
       • Item 3
       
       **Finance:**
       • Item A
       • Item B"
       
       🔴 SI TU NE METS PAS DE RETOURS À LA LIGNE, LE FORMAT SERA CASSÉ 🔴
    
    4. **Citations obligatoires**:
       ${needsRecentInfo || needsWebVerification ? '🔴 Pour CHAQUE fait, cite la source : [Source: URL_exacte]' : 'Cite les sources quand disponibles : [Source: URL]'}
       - Format : "L'ESILV propose 15 majeures [Source: https://www.esilv.fr/formations/...]"
       - En fin de réponse, section "Sources consultées:" avec toutes les URLs
    
    5. **Ton adapté**:
       - Lycéen/étudiant : pédagogique, rassurant, détaillé
       - Parent : factuel, sécurisant, focus débouchés/qualité
       - Professionnel : concis, précis, focus partenariats
    
    6. **Cohérence**: Reste cohérent avec les messages précédents de la conversation
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    EXEMPLE DE RÉPONSE (pour "Quelles sont les majeures?"):
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    "L'ESILV propose 15 majeures de spécialisation en cycle ingénieur, dont 14 sont accessibles en alternance.
    
    **Informatique & Data:**
    • Data et intelligence artificielle
    • Objets connectés & cybersécurité
    • Cloud computing & cybersécurité
    • Ingénierie logicielle & IA
    
    **Finance & Business:**
    • Ingénierie financière
    • Fintech
    • Actuariat
    
    **Industrie & Innovation:**
    • Modélisation et mécanique numérique
    • Industrie et robotique
    • Creative Technology
    • Conception mécanique et Industrie durable
    
    **Énergie & Santé:**
    • Énergie et villes durables
    • MedTech & Santé
    • Éco-innovation
    • Aérospatial et Défense
    
    Ces majeures sont choisies en 4ème année et approfondies en 5ème année. [Source: https://www.esilv.fr/formations/majeures/]
    
    Souhaitez-vous des détails sur une majeure en particulier ?"
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    EXEMPLE 2 (pour "Quelles sont les associations?"):
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    "Le Pôle Léonard de Vinci regroupe plus de 60 associations étudiantes qui animent la vie étudiante tout au long de l'année.
    
    **Associations sportives:**
    • Leo volley — l'association de volley-ball du pôle
    • Léo Basket — fédère les étudiants autour du basketball
    • Aviron de Vinci — l'association d'aviron du Pôle
    
    **Associations académiques & professionnelles:**
    • Leolearning — aide gratuite pour les cours et projets (tutorat)
    • Club entrepreneurs — association d'entrepreneuriat en lien avec Devinci Startup
    • DeVinci Junior — la Junior-Entreprise du Pôle Léonard de Vinci
    
    **Vie étudiante:**
    • BDE Nantes — Bureau des Étudiants du campus de Nantes
    
    Ces associations permettent d'acquérir des compétences en gestion de projet, événementiel, communication et développement de partenariats. [Source: https://www.esilv.fr/vie-etudiante/associations/]
    
    Êtes-vous intéressé par un type d'association en particulier ?"
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⚠️ RAPPEL FINAL AVANT DE RÉPONDRE:
    - N'inclus JAMAIS les lignes de séparation (━━━) dans ta réponse
    - Utilise UNIQUEMENT les données fournies dans la section "DONNÉES DISPONIBLES"
    - Si les données ne répondent pas à la question, admets-le honnêtement
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    Maintenant, réponds à la question de l'utilisateur en suivant STRICTEMENT ces instructions.
    `

    try {
      if ((needsRecentInfo || needsWebVerification) && webResults) {
        console.log('\n🌐 SCRAPER WEB - Résultats trouvés:')
        console.log(webResults.substring(0, 300) + '...\n')
      } else {
        console.log('\n🔍 RECHERCHE RAG - Résultats trouvés:')
        console.log(knowledgeResults.substring(0, 300) + '...\n')
      }
      
      let response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      
      // Post-traiter pour forcer les retours à la ligne Markdown
      response = this.fixMarkdownLineBreaks(response)
      
      // Retourner le bon agentType selon la source utilisée
      const agentType = (needsRecentInfo || needsWebVerification) && webResults ? 'scraper' : 'retrieval'
      
      // Calculer l'âge des données
      let dataAge = 0
      if (sources.length > 0) {
        const oldestSource = sources[0]
        const lastVerified = oldestSource.lastVerified ? new Date(oldestSource.lastVerified) : new Date(oldestSource.createdAt)
        dataAge = Math.floor((new Date().getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24))
      }
      
      // Calculer le niveau de confiance dynamiquement
      const usedScraper = (needsRecentInfo || needsWebVerification) && webResults ? true : false
      const confidence = this.calculateConfidence(sources, usedScraper, dataAge)
      
      console.log(`📊 Niveau de confiance calculé: ${Math.round(confidence * 100)}% (sources: ${sources.length}, âge: ${dataAge}j, scraper: ${usedScraper})`)

      return {
        response: response || 'Désolé, je ne peux pas répondre à cette question pour le moment.',
        agentType: agentType,
        confidence: confidence,
        ragSources: sources
      }
    } catch (error) {
      console.error('Error in retrieval agent:', error)
      return {
        response: 'Je rencontre des difficultés techniques. Veuillez réessayer plus tard.',
        agentType: 'retrieval',
        confidence: 0.2, // Très faible confiance en cas d'erreur
        ragSources: []
      }
    }
  }

  // Enhanced form filling agent
  async handleFormFilling(message: string, conversationHistory: any[] = []): Promise<{ response: string; agentType: AgentType; confidence?: number; showForm: boolean }> {
    await this.initialize()

    const prompt = `
    ⚠️ RÈGLE ABSOLUE : RÉPONDS UNIQUEMENT EN FRANÇAIS.
    
    Tu es l'assistant virtuel de l'ESILV (École Supérieure d'Ingénieurs Léonard-de-Vinci), spécialisé dans la collecte d'informations pour les demandes de contact, brochures et renseignements.
    
    L'utilisateur demande: "${message}"
    
    Réponds en français de manière professionnelle, rassurante et guide-le étape par étape.
    
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
      let response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      response = this.fixMarkdownLineBreaks(response)
      return {
        response: response || 'Je vais recueillir vos coordonnées pour vous contacter.',
        agentType: 'form_filling',
        confidence: 0.95, // Haute confiance pour les formulaires (processus standardisé)
        showForm: true
      }
    } catch (error) {
      console.error('Error in form filling agent:', error)
      return {
        response: 'Je vais recueillir vos coordonnées pour que notre équipe puisse vous contacter.',
        agentType: 'form_filling',
        confidence: 0.8,
        showForm: true
      }
    }
  }

  // Enhanced orchestration agent with memory
  async handleOrchestration(message: string, conversationHistory: any[] = []): Promise<{ response: string; agentType: AgentType; confidence?: number }> {
    await this.initialize()

    // Build conversation context (limité pour éviter un contexte trop long)
    const context = conversationHistory
      .slice(-3) // Réduit de 5 à 3 messages pour limiter la taille
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    const prompt = `
    ⚠️ RÈGLE ABSOLUE : RÉPONDS UNIQUEMENT EN FRANÇAIS. Jamais en anglais, quelle que soit la langue de la question ou du contexte.

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    IDENTITÉ
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Tu es l'assistant virtuel officiel de l'ESILV (École Supérieure d'Ingénieurs Léonard-de-Vinci).
    
    L'ESILV est une école d'ingénieurs généraliste post-bac, spécialisée dans les technologies numériques,
    située au Pôle Léonard de Vinci à Paris La Défense (avec aussi des campus à Nantes et Montpellier).
    
    **Domaines d'expertise:**
    - Formations (prépa intégrée, cycle ingénieur, 15 majeures, bachelors, MSc, MS, doubles diplômes)
    - Admissions (Concours Avenir, admissions parallèles, alternance)
    - Vie étudiante, campus (Paris, Nantes, Montpellier), services
    - Partenariats internationaux, entreprises, débouchés carrières
    
    **Ton**: Professionnel mais accessible, adapté à ton interlocuteur (lycéen, étudiant, parent, professionnel).

    CONTEXTE DE CONVERSATION (derniers messages):
    ${context}

    INSTRUCTIONS SUR LE CONTEXTE:
    - Utilise le CONTEXTE DE LA CONVERSATION uniquement pour comprendre l'historique et éviter les répétitions.
    - Ne résume pas le contexte dans ta réponse.
    - Ne cite pas explicitement des parties du contexte sauf si l'utilisateur le demande.

    TYPE D'AGENT ACTUEL: orchestration

    QUESTION UTILISATEUR:
    "${message}"

    INFORMATIONS DISPOS (BASE DE CONNAISSANCES / RAG OU AUTRES CONTEXTES):
    - Utilise en priorité les informations structurées provenant de la base de connaissances interne ESILV.
    - Si une information n'est pas disponible ou incertaine, explique-le explicitement au lieu d'inventer.

    INSTRUCTIONS GÉNÉRALES:
    1. Réponds UNIQUEMENT en français.
    2. Commence par 1 à 2 phrases qui répondent directement à la question.
    3. Ensuite, détaille si nécessaire avec:
      - des listes à puces pour les étapes, conditions, avantages, options, OU
      - de courts paragraphes pour les explications.
    4. Si la question ne concerne pas l'ESILV (ses formations, admissions, campus, vie étudiante, etc.),
      indique que tu es un assistant dédié à l'ESILV et redirige poliment l'utilisateur vers ce type de questions.
    5. Si l'information dépend d'une date (rentrée, calendrier, frais, actualités), précise que ces éléments
      peuvent évoluer et recommande de vérifier sur le site officiel de l'ESILV.
    6. Ne mentionne jamais le mot "prompt" ni la structure interne de ces instructions dans ta réponse.
    7. Adapte le niveau de détail: 
      - réponse plus pédagogique pour un lycéen,
      - plus concise et factuelle pour un professionnel.
    
    FORMAT DE RÉPONSE:
    1. Une ou deux phrases qui répondent directement à la question.
    2. Ensuite, si nécessaire:
      - une liste à puces pour les étapes, conditions, options, OU
      - un court paragraphe explicatif.
    3. Termine uniquement par une courte phrase de relance, par exemple:
      "Souhaitez-vous plus de détails sur ce point ?"

    OBJECTIF:
    Donner une réponse utile, exacte et facile à comprendre à la QUESTION UTILISATEUR, en t'appuyant sur le CONTEXTE DE CONVERSATION et les informations ESILV disponibles.
    Réponds maintenant en respectant strictement toutes ces consignes.
    
    `

    try {
      let response = await this.aiOrchestrator.generateCompletion(prompt, conversationHistory)
      response = this.fixMarkdownLineBreaks(response)
      return {
        response: response || 'Comment puis-je vous aider concernant ESILV ?',
        agentType: 'orchestration',
        confidence: 0.85 // Confiance moyenne pour les réponses générales
      }
    } catch (error) {
      console.error('Error in orchestration agent:', error)
      return {
        response: 'Je suis là pour vous aider avec des informations sur ESILV. Que souhaitez-vous savoir ?',
        agentType: 'orchestration',
        confidence: 0.7
      }
    }
  }

  // Enhanced knowledge base search with context size limit and better keyword extraction
  private async searchKnowledgeBase(query: string): Promise<{ results: string; sources: Array<{ question: string; answer: string; category: string; lastVerified?: Date; createdAt: Date }> }> {
    try {
      // Extraire les mots-clés pertinents de la requête
      const keywords = this.extractKeywords(query)
      
      console.log(`🔍 Recherche RAG avec mots-clés: ${keywords.join(', ')}`)
      
      // Construire les conditions de recherche pour chaque mot-clé
      // Pour SQLite case-insensitive: chercher à la fois minuscule et variantes capitalisées
      const searchConditions = keywords.flatMap(keyword => {
        const lower = keyword.toLowerCase()
        const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1)
        const upper = keyword.toUpperCase()
        
        return [
          { question: { contains: lower } },
          { answer: { contains: lower } },
          { category: { contains: lower } },
          { question: { contains: capitalized } },
          { answer: { contains: capitalized } },
          { question: { contains: upper } },
          { answer: { contains: upper } }
        ]
      })
      
      // Récupérer plus de résultats pour faire du scoring
      let results = await db.knowledgeBase.findMany({
        where: {
          OR: searchConditions
        },
        take: 30 // Récupérer 30 résultats pour scorer
      })
      
      // Fonction helper pour normaliser le texte (supprime espaces, tirets, apostrophes)
      const normalize = (text: string) => {
        return text.toLowerCase()
          .replace(/[\s\-']/g, '')  // Supprime espaces, tirets, apostrophes
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Supprime accents
      }
      
      // Scorer les résultats par nombre de mots-clés matchés
      const scoredResults = results.map(result => {
        let score = 0
        const questionLower = result.question.toLowerCase()
        const answerLower = result.answer.toLowerCase()
        const categoryLower = result.category.toLowerCase()
        
        // Version normalisée pour matching flexible
        const questionNormalized = normalize(result.question)
        const answerNormalized = normalize(result.answer)
        const categoryNormalized = normalize(result.category)
        
        keywords.forEach(keyword => {
          const keywordLower = keyword.toLowerCase()
          const keywordNormalized = normalize(keyword)
          
          // +5 points si le mot-clé est dans la question (exact ou normalisé)
          if (questionLower.includes(keywordLower) || questionNormalized.includes(keywordNormalized)) {
            score += 5
          }
          // +3 points si le mot-clé est dans la catégorie
          if (categoryLower.includes(keywordLower) || categoryNormalized.includes(keywordNormalized)) {
            score += 3
          }
          // +2 points si le mot-clé est dans la réponse
          if (answerLower.includes(keywordLower) || answerNormalized.includes(keywordNormalized)) {
            score += 2
          }
        })
        
        // Bonus si confidence élevée
        if (result.confidence && result.confidence > 0.9) score += 1
        
        return { ...result, relevanceScore: score }
      })
      
      // Trier par score de pertinence décroissant
      scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      
      // Prendre les 5 meilleurs
      results = scoredResults.slice(0, 5).map(r => {
        const { relevanceScore, ...rest } = r
        return rest
      })
      
      console.log(`📊 RAG: ${scoredResults.length} résultat(s) trouvé(s), top 5 sélectionnés par pertinence`)
      
      if (scoredResults.length > 0) {
        console.log(`   Meilleurs résultats (par score):`)
        scoredResults.slice(0, 3).forEach(r => {
          console.log(`   - [Score: ${r.relevanceScore}] ${r.question.substring(0, 50)}...`)
        })
      }

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

  // Post-traiter la réponse pour forcer les retours à la ligne dans les listes Markdown
  private fixMarkdownLineBreaks(text: string): string {
    if (!text) return text
    
    // Détecter les patterns où plusieurs bullets sont sur la même ligne
    // Pattern: "• Item1 • Item2" → "• Item1\n• Item2"
    let fixed = text
      .replace(/([•\-])\s*([^•\-\n]+)\s+([•\-])/g, '$1 $2\n$3') // Premier passage
      .replace(/([•\-])\s*([^•\-\n]+)\s+([•\-])/g, '$1 $2\n$3') // Deuxième passage (au cas où)
      .replace(/([•\-])\s*([^•\-\n]+)\s+([•\-])/g, '$1 $2\n$3') // Troisième passage
    
    // Ajouter des retours à la ligne après les sections en gras
    fixed = fixed.replace(/(\*\*[^*]+\*\*:)\s+([•\-])/g, '$1\n$2')
    
    // S'assurer qu'il y a un espace après chaque bullet
    fixed = fixed.replace(/([•\-])([^\s])/g, '$1 $2')
    
    return fixed
  }

  // Extraire les mots-clés pertinents d'une requête
  private extractKeywords(query: string): string[] {
    // Mots vides à ignorer (étendu)
    const stopWords = [
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux', 'et', 'ou', 'est', 'sont',
      'quoi', 'quel', 'quelle', 'quels', 'quelles', 'comment', 'où', 'qui', 'que', 'quand', 'pourquoi',
      'pourrais', 'pourrait', 'peux', 'peut', 'faire', 'fais', 'fait', 'donner', 'donne',
      'me', 'te', 'nous', 'vous', 'leur', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
      'tableau', 'liste', 'détails', 'infos', 'information', 'informations',
      'esilv', 'école', 'ecole', // Ne pas chercher "esilv" car trop générique
      'l', 'd', 'c', 'j', 's', 'n', 'm', 't', 'y'
    ]
    
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
      
      // Ajouter variantes pour les mots accentués
      const deaccented = word
        .replace(/é|è|ê|ë/g, 'e')
        .replace(/à|â|ä/g, 'a')
        .replace(/ù|û|ü/g, 'u')
        .replace(/ô|ö/g, 'o')
        .replace(/ï|î/g, 'i')
      if (deaccented !== word) {
        keywords.add(deaccented)
      }
    })
    
    return Array.from(keywords).slice(0, 6) // Limiter à 6 mots-clés max
  }

  // Comparer les données du RAG avec les données web pour détecter les conflits
  private compareDataSources(
    ragResults: string,
    webResults: string,
    query: string
  ): {
    hasConflict: boolean
    confidence: 'high' | 'medium' | 'low'
    differences: string[]
  } {
    const differences: string[] = []
    let conflictScore = 0

    try {
      // 1. Extraire les entités nommées (noms de personnes)
      const ragNames = this.extractNames(ragResults)
      const webNames = this.extractNames(webResults)

      // Comparer les noms (important pour les responsables, contacts)
      if (ragNames.length > 0 && webNames.length > 0) {
        const ragNamesSet = new Set(ragNames.map(n => n.toLowerCase()))
        const webNamesSet = new Set(webNames.map(n => n.toLowerCase()))
        
        // Chercher des noms différents pour le même rôle
        if (!this.haveSameElements(ragNamesSet, webNamesSet)) {
          differences.push(`Noms différents détectés - RAG: [${ragNames.join(', ')}] vs Web: [${webNames.join(', ')}]`)
          conflictScore += 3  // Conflit élevé
        }
      }

      // 2. Extraire et comparer les dates
      const ragDates = this.extractDates(ragResults)
      const webDates = this.extractDates(webResults)

      if (ragDates.length > 0 && webDates.length > 0) {
        // Comparer les années récentes (2024, 2025)
        const ragRecentDates = ragDates.filter(d => d.includes('2024') || d.includes('2025'))
        const webRecentDates = webDates.filter(d => d.includes('2024') || d.includes('2025'))
        
        if (ragRecentDates.length > 0 && webRecentDates.length > 0) {
          const ragDatesSet = new Set(ragRecentDates)
          const webDatesSet = new Set(webRecentDates)
          
          if (!this.haveSameElements(ragDatesSet, webDatesSet)) {
            differences.push(`Dates différentes - RAG: [${ragRecentDates.join(', ')}] vs Web: [${webRecentDates.join(', ')}]`)
            conflictScore += 2  // Conflit moyen-élevé
          }
        }
      }

      // 3. Extraire et comparer les nombres/statistiques
      const ragNumbers = this.extractNumbers(ragResults)
      const webNumbers = this.extractNumbers(webResults)

      if (ragNumbers.length > 0 && webNumbers.length > 0) {
        // Comparer les grands nombres (statistiques, pourcentages, salaires)
        const ragBigNumbers = ragNumbers.filter(n => parseInt(n) > 50)
        const webBigNumbers = webNumbers.filter(n => parseInt(n) > 50)
        
        if (ragBigNumbers.length > 0 && webBigNumbers.length > 0) {
          const ragNumbersSet = new Set(ragBigNumbers)
          const webNumbersSet = new Set(webBigNumbers)
          
          if (!this.haveSameElements(ragNumbersSet, webNumbersSet)) {
            differences.push(`Chiffres différents - RAG: [${ragBigNumbers.slice(0, 5).join(', ')}] vs Web: [${webBigNumbers.slice(0, 5).join(', ')}]`)
            conflictScore += 1  // Conflit moyen
          }
        }
      }

      // 4. Comparer les mots-clés principaux (hors stopwords)
      const ragKeywords = this.extractKeywords(ragResults)
      const webKeywords = this.extractKeywords(webResults)

      const commonKeywords = ragKeywords.filter(k => 
        webKeywords.some(wk => wk.toLowerCase() === k.toLowerCase())
      )

      // Si peu de mots-clés en commun, c'est peut-être des infos complètement différentes
      const keywordOverlap = commonKeywords.length / Math.max(ragKeywords.length, webKeywords.length, 1)
      
      if (keywordOverlap < 0.3 && ragKeywords.length > 3 && webKeywords.length > 3) {
        differences.push(`Peu de mots-clés communs (${Math.round(keywordOverlap * 100)}% overlap)`)
        conflictScore += 1
      }

      // 5. Déterminer le niveau de conflit
      let hasConflict = conflictScore > 0
      let confidence: 'high' | 'medium' | 'low' = 'low'

      if (conflictScore >= 3) {
        confidence = 'high'
      } else if (conflictScore >= 2) {
        confidence = 'medium'
      } else if (conflictScore >= 1) {
        confidence = 'low'
      } else {
        hasConflict = false
      }

      // Log pour debug
      if (hasConflict) {
        console.log(`⚠️ Conflit détecté (score: ${conflictScore}, confidence: ${confidence})`)
        console.log(`📊 Différences: ${differences.join(' | ')}`)
      } else {
        console.log(`✅ Pas de conflit significatif détecté`)
      }

      return { hasConflict, confidence, differences }

    } catch (error) {
      console.error('❌ Erreur lors de la comparaison des sources:', error)
      return { hasConflict: false, confidence: 'low', differences: [] }
    }
  }

  // Extraire les noms de personnes (heuristique simple)
  private extractNames(text: string): string[] {
    // Chercher des patterns comme "M. Nom" ou "Prénom Nom" ou "Dr. Nom"
    const namePatterns = [
      /(?:M\.|Mme|Dr\.|Pr\.|Professeur|Responsable)\s+([A-Z][a-zéèêëàâäôöûüçñ]+(?:\s+[A-Z][a-zéèêëàâäôöûüçñ]+)*)/g,
      /\b([A-Z][a-zéèêëàâäôöûüçñ]+\s+[A-Z][A-ZÉÈÊËÀÂÄÔÖÛÜÇÑ]+)/g,
    ]
    
    const names = new Set<string>()
    
    namePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        names.add(match[1].trim())
      }
    })
    
    return Array.from(names)
  }

  // Extraire les dates
  private extractDates(text: string): string[] {
    const datePatterns = [
      /\b(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\b/gi,
      /\b(\d{4})\b/g,  // Années seules
      /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g  // Format DD/MM/YYYY
    ]
    
    const dates = new Set<string>()
    
    datePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        dates.add(match[0].trim())
      }
    })
    
    return Array.from(dates)
  }

  // Extraire les nombres
  private extractNumbers(text: string): string[] {
    const numberPattern = /\b(\d+(?:[.,]\d+)?)\b/g
    const numbers = new Set<string>()
    
    let match
    while ((match = numberPattern.exec(text)) !== null) {
      numbers.add(match[1])
    }
    
    return Array.from(numbers)
  }

  // Vérifier si deux ensembles ont des éléments en commun
  private haveSameElements(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size === 0 && set2.size === 0) return true
    if (set1.size === 0 || set2.size === 0) return false
    
    // Vérifier si au moins un élément est en commun
    for (const item of set1) {
      if (set2.has(item)) return true
    }
    return false
  }

  // Détecter et résoudre les conflits entre données web et RAG
  private async detectAndResolveConflicts(
    webData: string,
    query: string,
    sources: any[]
  ): Promise<{
    conflictsFound: number
    entriesToDelete: string[]
    newDataToAdd: any
  }> {
    try {
      console.log('🔍 Détection de conflits avec l\'API find_conflicts...')
      
      // 1. Appeler l'API find_conflicts
      const response = await fetch('http://localhost:3000/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find_conflicts',
          newInfo: webData
        })
      })

      if (!response.ok) {
        console.error('❌ Erreur API find_conflicts:', response.status)
        return { conflictsFound: 0, entriesToDelete: [], newDataToAdd: null }
      }

      const { conflicts, count } = await response.json()
      console.log(`📊 ${count} conflits potentiels détectés`)

      if (count === 0) {
        return { conflictsFound: 0, entriesToDelete: [], newDataToAdd: null }
      }

      // 2. Analyser les conflits et décider lesquels supprimer
      const entriesToDelete: string[] = []
      const currentDate = new Date()

      for (const conflict of conflicts) {
        // Vérifier l'âge de l'entrée en conflit
        const entryAge = sources.find(s => s.question === conflict.question)
        const lastVerified = entryAge?.lastVerified 
          ? new Date(entryAge.lastVerified)
          : entryAge?.createdAt 
            ? new Date(entryAge.createdAt)
            : null

        let shouldDelete = false

        if (lastVerified) {
          const daysSinceVerification = Math.floor(
            (currentDate.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Règles de décision
          if (daysSinceVerification > 30) {
            // Données anciennes (> 30 jours) : privilégier les données web
            shouldDelete = true
            console.log(`🗑️  Entrée à supprimer (${daysSinceVerification} jours): "${conflict.question.substring(0, 50)}..."`)
          } else if (daysSinceVerification > 7) {
            // Données modérément anciennes (7-30 jours)
            // Vérifier si c'est une information variable (personnel, contacts)
            const isVariableInfo = /responsable|contact|directeur|manager|personnel|équipe|téléphone|email/i.test(conflict.question)
            if (isVariableInfo) {
              shouldDelete = true
              console.log(`🗑️  Entrée variable à supprimer (${daysSinceVerification} jours): "${conflict.question.substring(0, 50)}..."`)
            }
          }
        } else {
          // Pas de date de vérification : considérer comme ancien
          shouldDelete = true
          console.log(`🗑️  Entrée sans date de vérification à supprimer: "${conflict.question.substring(0, 50)}..."`)
        }

        if (shouldDelete) {
          entriesToDelete.push(conflict.id)
        }
      }

      // 3. Préparer les nouvelles données à ajouter
      // Parser le webData pour extraire les informations structurées
      const newDataToAdd = this.parseWebDataForRAG(webData, query)

      console.log(`✅ Résolution: ${entriesToDelete.length} entrées à supprimer, nouvelles données préparées`)

      return {
        conflictsFound: count,
        entriesToDelete,
        newDataToAdd
      }

    } catch (error) {
      console.error('❌ Erreur lors de la détection de conflits:', error)
      return { conflictsFound: 0, entriesToDelete: [], newDataToAdd: null }
    }
  }

  // Parser les données web pour créer des entrées RAG structurées
  private parseWebDataForRAG(webData: string, query: string): any {
    try {
      // Format actuel du webData: "📰 Source: ... 📌 Titre: ... 📅 Date: ... 📄 Contenu: ..."
      const entries: any[] = []

      // Séparer les différents résultats (s'il y en a plusieurs)
      const results = webData.split('📰 Source:').filter(r => r.trim())

      for (const result of results) {
        // Extraire les différentes parties
        const urlMatch = result.match(/^([^\n]+)/)
        const titleMatch = result.match(/📌 Titre:\s*([^\n]+)/)
        const dateMatch = result.match(/📅 Date:\s*([^\n]+)/)
        const tagsMatch = result.match(/🏷️\s+Tags:\s*([^\n]+)/)
        const contentMatch = result.match(/📄 Contenu:\s*([\s\S]+)/)

        if (titleMatch && contentMatch) {
          const url = urlMatch ? urlMatch[1].trim() : ''
          const title = titleMatch[1].trim()
          const date = dateMatch ? dateMatch[1].trim() : ''
          const tags = tagsMatch ? tagsMatch[1].trim().split(',').map(t => t.trim()) : []
          const content = contentMatch[1].trim()

          // Générer une question pertinente basée sur le titre et la query
          let question = query
          if (title.length > 10) {
            // Utiliser le titre pour créer une question plus spécifique
            question = `${query} - ${title}`
          }

          // Déterminer la catégorie automatiquement
          let category = 'actualités'
          if (/alumni|anciens|diplômés/i.test(query + title)) {
            category = 'alumni'
          } else if (/stage|alternance|emploi/i.test(query + title)) {
            category = 'stages_emploi'
          } else if (/admission|concours/i.test(query + title)) {
            category = 'admissions'
          } else if (/recherche|professeur/i.test(query + title)) {
            category = 'recherche'
          } else if (/responsable|contact|personnel/i.test(query + title)) {
            category = 'contacts_personnel'
          }

          entries.push({
            question: question.substring(0, 255),  // Limiter la longueur
            answer: content.substring(0, 2000),    // Limiter la longueur
            category,
            confidence: 0.90,  // Haute confiance (source officielle)
            source: url,
            tags: tags.length > 0 ? tags : undefined
          })
        }
      }

      return entries.length > 0 ? entries : null

    } catch (error) {
      console.error('❌ Erreur lors du parsing du webData:', error)
      return null
    }
  }

  // Mettre à jour le RAG avec les données web (suppression + ajout)
  private async updateRAGWithWebData(
    conflictResolution: {
      conflictsFound: number
      entriesToDelete: string[]
      newDataToAdd: any
    },
    query: string
  ): Promise<{
    deleted: number
    added: number
    updated: number
  }> {
    let deleted = 0
    let added = 0
    let updated = 0

    try {
      console.log('🔧 Mise à jour du RAG en cours...')

      // 1. Supprimer les entrées obsolètes
      if (conflictResolution.entriesToDelete.length > 0) {
        console.log(`🗑️  Suppression de ${conflictResolution.entriesToDelete.length} entrées obsolètes...`)
        
        const deleteResponse = await fetch('http://localhost:3000/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulk_delete',
            ids: conflictResolution.entriesToDelete
          })
        })

        if (deleteResponse.ok) {
          const deleteData = await deleteResponse.json()
          deleted = deleteData.count || 0
          console.log(`✅ ${deleted} entrées supprimées`)
          
          // Logger chaque suppression
          for (const entryId of conflictResolution.entriesToDelete) {
            await this.logRAGUpdate('delete', entryId, null, null, null, query, null)
          }
        } else {
          console.error('❌ Erreur lors de la suppression:', deleteResponse.status)
        }
      }

      // 2. Ajouter les nouvelles entrées
      if (conflictResolution.newDataToAdd && Array.isArray(conflictResolution.newDataToAdd)) {
        console.log(`➕ Ajout de ${conflictResolution.newDataToAdd.length} nouvelles entrées...`)
        
        // Préparer les données pour l'insertion
        const entriesToAdd = conflictResolution.newDataToAdd.map((entry: any) => ({
          id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: entry.question,
          answer: entry.answer,
          category: entry.category,
          confidence: entry.confidence,
          source: entry.source,
          lastVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }))

        const addResponse = await fetch('http://localhost:3000/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulk_create',
            items: entriesToAdd
          })
        })

        if (addResponse.ok) {
          const addData = await addResponse.json()
          added = addData.count || 0
          console.log(`✅ ${added} nouvelles entrées ajoutées`)
          
          // Logger chaque ajout
          for (let i = 0; i < conflictResolution.newDataToAdd.length; i++) {
            const entry = conflictResolution.newDataToAdd[i]
            const entryId = entriesToAdd[i].id
            await this.logRAGUpdate(
              'add',
              entryId,
              null,
              entry.answer.substring(0, 200),
              entry.source,
              query,
              entry.confidence
            )
          }
        } else {
          console.error('❌ Erreur lors de l\'ajout:', addResponse.status)
        }
      }

      // 3. Mettre à jour lastVerified pour les entrées non supprimées mais vérifiées
      // (Pour l'instant, on considère que les entrées non en conflit sont toujours valides)
      // Cette étape pourrait être améliorée pour mettre à jour lastVerified même sans conflit

      console.log(`✅ Mise à jour RAG terminée: ${deleted} supprimées, ${added} ajoutées, ${updated} mises à jour`)

      return { deleted, added, updated }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du RAG:', error)
      return { deleted, added, updated }
    }
  }

  // Logger une mise à jour du RAG
  private async logRAGUpdate(
    updateType: 'delete' | 'add' | 'update' | 'verify',
    entryId: string | null,
    oldValue: string | null,
    newValue: string | null,
    source: string | null,
    query: string,
    confidence: number | null
  ): Promise<void> {
    try {
      await fetch('http://localhost:3000/api/rag-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateType,
          entryId,
          oldValue,
          newValue,
          source,
          query,
          confidence,
          triggeredBy: 'scraper'
        })
      })
    } catch (error) {
      console.error('❌ Erreur lors du logging RAG update:', error)
      // Ne pas bloquer le flux principal si le logging échoue
    }
  }

  // Enhanced ESILV-specific web search
  private async searchWebESILV(query: string, currentDate?: Date): Promise<string> {
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
          autoSave: false    // Ne pas sauvegarder automatiquement, l'orchestrateur décidera
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
              source: result.url
            }
          })
          
          console.log(`  ✅ Ajouté au RAG: "${result.title.substring(0, 50)}..."`)
        } else {
          console.log(`  ⏭️  Déjà dans RAG: "${result.title.substring(0, 50)}..."`)
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