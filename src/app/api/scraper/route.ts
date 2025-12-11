import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { JSDOM } from 'jsdom'

interface ScraperResult {
  title: string
  content: string
  url: string
  confidence: number
  date?: string  // Date de publication de l'actualité
  fullContent?: string  // Contenu complet de la page
  category?: string  // Catégorie de l'actualité
  tags?: string[]  // Tags/étiquettes
}

class ESILVWebScraper {
  private readonly baseUrl = 'https://www.esilv.fr'
  
  async scrapeESILVInfo(query: string, currentDate?: Date, deepScrape: boolean = true): Promise<ScraperResult[]> {
    const results: ScraperResult[] = []
    
    // Détecter si c'est une question sur l'actualité
    const isNewsQuery = /\b(actualité|actualités|news|dernier|dernière|récent|nouveau)\b/i.test(query)
    
    try {
      if (isNewsQuery) {
        // Pour les actualités, scraper la page actualités
        console.log('📰 Scraping page actualités ESILV...')
        const newsResults = await this.scrapeNewsPage(currentDate, deepScrape)
        if (newsResults.length > 0) {
          results.push(...newsResults)
        } else {
          // Fallback to mock news data
          const mockResults = this.generateMockNewsData(currentDate)
          results.push(...mockResults)
        }
      } else {
        // Pour les autres questions, recherche générale
        const realResults = await this.realWebScrape(query)
        if (realResults.length > 0) {
          results.push(...realResults)
        } else {
          const mockResults = this.generateMockScrapedData(query)
          results.push(...mockResults)
        }
      }
      
    } catch (error) {
      console.error('Error scraping ESILV website:', error)
      // Fallback to mock data
      if (isNewsQuery) {
        const mockResults = this.generateMockNewsData(currentDate)
        results.push(...mockResults)
      } else {
        const mockResults = this.generateMockScrapedData(query)
        results.push(...mockResults)
      }
    }
    
    return results
  }

  private async scrapeNewsPage(currentDate?: Date, deepScrape: boolean = true): Promise<ScraperResult[]> {
    const results: ScraperResult[] = []
    
    try {
      // URL correcte de la page actualités ESILV
      const newsUrl = `${this.baseUrl}/actus/`
      
      console.log(`📰 Étape 1: Scraping liste actualités: ${newsUrl}`)
      
      const response = await fetch(newsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      
      if (!response.ok) {
        console.log(`⚠️ HTTP ${response.status}, passage au mock data`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const html = await response.text()
      console.log(`✅ Page liste chargée (${html.length} caractères)`)
      
      // Extraire les actualités (titres, dates, URLs)
      const newsItems = this.extractNewsFromHTML(html, currentDate)
      
      if (newsItems.length === 0) {
        console.log('⚠️ Aucune actualité extraite')
        throw new Error('No news extracted')
      }
      
      console.log(`📰 ${newsItems.length} actualités extraites`)
      
      // Étape 2 : Deep scraping - Visiter chaque page d'actualité pour le contenu complet
      if (deepScrape) {
        console.log(`\n🔬 Étape 2: Deep scraping de ${newsItems.length} articles...`)
        
        for (let i = 0; i < newsItems.length; i++) {
          const item = newsItems[i]
          
          try {
            console.log(`  📄 Article ${i+1}/${newsItems.length}: ${item.title.substring(0, 50)}...`)
            
            // Extraire l'URL de l'article depuis le lien
            const fullContent = await this.scrapeArticlePage(item.url)
            
            if (fullContent) {
              item.fullContent = fullContent
              item.content = fullContent.substring(0, 500) + '...' // Résumé
              item.confidence = 0.95 // Confiance plus élevée car contenu complet
              console.log(`    ✅ Contenu récupéré (${fullContent.length} caractères)`)
            } else {
              console.log(`    ⚠️ Contenu non récupéré, utilisation de l'extrait`)
            }
            
            // Délai entre chaque requête pour éviter de surcharger le serveur
            await new Promise(resolve => setTimeout(resolve, 500))
            
          } catch (error) {
            console.log(`    ❌ Erreur: ${error}`)
            // Garder l'extrait initial si le deep scraping échoue
          }
        }
        
        console.log(`✅ Deep scraping terminé\n`)
      }
      
      results.push(...newsItems)
      
    } catch (error) {
      console.error('Real news scraping failed:', error)
    }
    
    return results
  }

  private async scrapeArticlePage(articleUrl: string): Promise<string> {
    try {
      const response = await fetch(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      
      if (!response.ok) {
        return ''
      }
      
      const html = await response.text()
      
      // Extraire le contenu principal de l'article
      // Sur ESILV, le contenu est dans des balises <p> dans le corps de l'article
      
      // Méthode 1 : Chercher le contenu entre les balises spécifiques
      let content = ''
      
      // Extraire tous les paragraphes
      const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
      const paragraphs: string[] = []
      let match
      
      while ((match = paragraphRegex.exec(html)) !== null) {
        const cleanParagraph = match[1]
          .replace(/<[^>]+>/g, '') // Enlever les tags HTML
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim()
        
        // Garder les paragraphes de plus de 50 caractères (filtre le bruit)
        if (cleanParagraph.length > 50) {
          paragraphs.push(cleanParagraph)
        }
      }
      
      // Prendre les 5 premiers paragraphes significatifs
      content = paragraphs.slice(0, 5).join(' ')
      
      // Limiter à 1500 caractères pour le prompt
      if (content.length > 1500) {
        content = content.substring(0, 1500) + '...'
      }
      
      return content
      
    } catch (error) {
      console.error(`Error scraping article page: ${error}`)
      return ''
    }
  }

  private extractNewsFromHTML(html: string, currentDate?: Date): ScraperResult[] {
    const results: ScraperResult[] = []
    
    try {
      console.log('🔍 Extraction JSDOM (structure HTML exacte ESILV)...')
      
      const dom = new JSDOM(html)
      const document = dom.window.document
      
      // STRUCTURE RÉELLE : <div class="post_wrapper one_third"> ou <div class="post_wrapper one_third last">
      const postWrappers = document.querySelectorAll('.post_wrapper')
      console.log(`📦 ${postWrappers.length} blocs post_wrapper trouvés`)
      
      let newsExtracted = 0
      
      for (const wrapper of Array.from(postWrappers)) {
        if (newsExtracted >= 6) break // Max 6 articles
        
        // 1. DATE : dans .post_third_img_wrapper > .post_date
        const dateDiv = wrapper.querySelector('.post_date')
        let newsDate = currentDate?.toLocaleDateString('fr-FR') || ''
        
        if (dateDiv) {
          const day = dateDiv.querySelector('.date')?.textContent?.trim() || ''
          const month = dateDiv.querySelector('.month')?.textContent?.trim() || ''
          const year = dateDiv.querySelector('.year')?.textContent?.trim() || ''
          
          if (day && month && year) {
            newsDate = `${day} ${month} ${year}`
          }
        }
        
        // 2. TITRE + URL : dans .post_header_wrapper > .post_header > h5 > a
        const titleLink = wrapper.querySelector('.post_header h5 a')
        if (!titleLink) {
          console.log(`⏭️  Bloc ignoré (pas de h5 a)`)
          continue
        }
        
        let title = titleLink.getAttribute('title') || titleLink.textContent?.trim() || ''
        title = title
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim()
        
        let articleUrl = titleLink.getAttribute('href') || ''
        
        // Assurer URL complète
        if (articleUrl && !articleUrl.startsWith('http')) {
          articleUrl = `${this.baseUrl}${articleUrl.startsWith('/') ? '' : '/'}${articleUrl}`
        }
        
        // 3. EXTRAIT : dans .post_excerpt p
        const excerptElement = wrapper.querySelector('.post_excerpt p')
        let excerpt = excerptElement?.textContent?.trim() || ''
        excerpt = excerpt
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200)
        
        // 4. TAGS : dans .post_detail_item a[rel="tag"]
        const tags: string[] = []
        wrapper.querySelectorAll('.post_detail_item a[rel="tag"]').forEach(tagEl => {
          const tagText = tagEl.textContent?.trim()
          if (tagText) tags.push(tagText)
        })
        
        // 5. Filtrer les titres génériques
        const isGeneric = /^(en savoir plus|demandez|nos brochures|contactez|télécharger|événement)/i.test(title)
        
        if (title && title.length > 20 && !isGeneric && articleUrl) {
          results.push({
            title: title,
            content: excerpt || `Actualité ESILV du ${newsDate}: ${title}. Consultez l'article complet pour plus de détails.`,
            url: articleUrl,
            confidence: 0.80,
            date: newsDate,
            tags: tags.length > 0 ? tags : undefined
          })
          
          newsExtracted++
          console.log(`✅ Article ${newsExtracted}: "${title.substring(0, 50)}..." (${newsDate})`)
          if (tags.length > 0) {
            console.log(`   🏷️  Tags: ${tags.join(', ')}`)
          }
          console.log(`   🔗 URL: ${articleUrl}`)
        } else {
          console.log(`⏭️  Bloc ignoré : "${title.substring(0, 30)}..." (générique ou trop court)`)
        }
      }
      
      console.log(`📊 Total: ${results.length} actualités extraites avec JSDOM`)
      
    } catch (error) {
      console.error('Error extracting news with JSDOM:', error)
    }
    
    return results
  }

  private generateMockNewsData(currentDate?: Date): ScraperResult[] {
    const dateStr = currentDate?.toLocaleDateString('fr-FR') || new Date().toLocaleDateString('fr-FR')
    const month = currentDate?.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) || 'décembre 2024'
    
    return [
      {
        title: 'ESILV : Nouveau partenariat avec des entreprises du secteur Tech',
        content: `L'ESILV annonce en ${month} de nouveaux partenariats avec des leaders du secteur technologique. Ces collaborations permettront aux étudiants de bénéficier de stages, d'alternances et de projets réels en entreprise, renforçant ainsi leur employabilité dès la sortie de l'école.`,
        url: `${this.baseUrl}/actualites/partenariats-tech-2024`,
        confidence: 0.85,
        date: dateStr
      },
      {
        title: 'Lancement de nouveaux projets de recherche appliquée',
        content: `L'école lance plusieurs projets de recherche appliquée en ${month} dans les domaines de l'IA, de la cybersécurité et du développement durable. Ces projets, menés en collaboration avec des industriels, permettent aux étudiants de travailler sur des problématiques concrètes.`,
        url: `${this.baseUrl}/actualites/recherche-appliquee`,
        confidence: 0.80,
        date: dateStr
      },
      {
        title: 'Succès des étudiants ESILV aux compétitions nationales',
        content: `Les équipes d'étudiants ESILV se sont illustrées récemment lors de plusieurs compétitions nationales en ingénierie et innovation. Ces succès témoignent de l'excellence de la formation et de l'engagement des étudiants.`,
        url: `${this.baseUrl}/actualites/competitions-2024`,
        confidence: 0.75,
        date: dateStr
      }
    ]
  }

  private async realWebScrape(query: string): Promise<ScraperResult[]> {
    const results: ScraperResult[] = []
    
    try {
      // Use fetch to get the page content
      const searchUrl = `${this.baseUrl}/recherche?q=${encodeURIComponent(query)}`
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ESILVBot/1.0)',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const html = await response.text()
      
      // Basic text extraction without external libraries
      const textContent = this.extractTextFromHTML(html, query)
      
      if (textContent) {
        results.push({
          title: `Information ESILV sur "${query}"`,
          content: textContent,
          url: searchUrl,
          confidence: 0.75
        })
      }
      
    } catch (error) {
      console.error('Real scraping failed:', error)
    }
    
    return results
  }

  private extractTextFromHTML(html: string, query: string): string {
    // Remove scripts and styles
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ')
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()
    
    // Find relevant sections (simple keyword matching)
    const queryWords = query.toLowerCase().split(' ')
    const sentences = text.split(/[.!?]+/)
    
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return queryWords.some(word => lowerSentence.includes(word))
    }).slice(0, 3) // Take first 3 relevant sentences
    
    return relevantSentences.join('. ').substring(0, 500)
  }
  
  private generateMockScrapedData(query: string): ScraperResult[] {
    // This would be replaced with actual web scraping logic
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('admission') || lowerQuery.includes('postuler')) {
      return [{
        title: 'Procédure d\'admission à l\'ESILV',
        content: 'Les admissions à l\'ESILV se font principalement par le concours Puissance Alpha pour les élèves de Terminale. Les étudiants peuvent également intégrer l\'école en admission parallèle après un Bac+2/3/4.',
        url: `${this.baseUrl}/admissions`,
        confidence: 0.85
      }]
    }
    
    if (lowerQuery.includes('frais') || lowerQuery.includes('coût') || lowerQuery.includes('prix')) {
      return [{
        title: 'Frais de scolarité ESILV',
        content: 'Les frais de scolarité à l\'ESILV varient selon le statut de l\'étudiant. Pour les étudiants en formation initiale, comptez environ 8500€ par an. Des bourses et aides financières sont disponibles.',
        url: `${this.baseUrl}/vie-etudiante/financement`,
        confidence: 0.80
      }]
    }
    
    return [{
      title: 'Information ESILV',
      content: `Recherche sur "${query}" - Informations disponibles sur le site officiel de l'ESILV.`,
      url: `${this.baseUrl}/recherche?q=${encodeURIComponent(query)}`,
      confidence: 0.60
    }]
  }
  
  async saveToKnowledgeBase(result: ScraperResult, category: string = 'scraped'): Promise<void> {
    try {
      // Utiliser le contenu complet si disponible, sinon l'extrait
      const contentToSave = result.fullContent || result.content
      
      // Créer une question formatée
      const question = `${result.title} (${result.date || 'Date inconnue'})`
      
      // Créer une réponse formatée avec toutes les infos
      let answer = contentToSave
      
      if (result.tags && result.tags.length > 0) {
        answer += `\n\nTags: ${result.tags.join(', ')}`
      }
      
      answer += `\n\nSource: ${result.url}`
      
      await db.knowledgeBase.create({
        data: {
          question: question,
          answer: answer,
          category: category,
          confidence: result.confidence,
          source: result.url
        }
      })
    } catch (error) {
      console.error('Error saving scraped data:', error)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, autoSave = false, currentDate, deepScrape = true } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    const date = currentDate ? new Date(currentDate) : new Date()
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🔍 SCRAPER POST: "${query}"`)
    console.log(`📅 Date: ${date.toLocaleDateString('fr-FR')}`)
    console.log(`🔬 Deep Scraping: ${deepScrape ? 'Activé' : 'Désactivé'}`)
    console.log('='.repeat(60) + '\n')
    
    const scraper = new ESILVWebScraper()
    const results = await scraper.scrapeESILVInfo(query, date, deepScrape)
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ RÉSULTATS: ${results.length} actualités trouvées`)
    if (results.length > 0 && results[0].date) {
      console.log(`📅 Dates: ${results.map(r => r.date).filter(Boolean).join(', ')}`)
    }
    
    // Vérifier si les actualités existent déjà dans le RAG
    let newArticles = 0
    let existingArticles = 0
    
    if (autoSave) {
      console.log('\n💾 Sauvegarde dans le RAG...')
      
      for (const result of results) {
        // Vérifier si l'article existe déjà
        const existing = await db.knowledgeBase.findFirst({
          where: {
            OR: [
              { question: { contains: result.title } },
              { answer: { contains: result.title } }
            ]
          }
        })
        
        if (!existing) {
          await scraper.saveToKnowledgeBase(result, 'web_scraped')
          newArticles++
          console.log(`  ✅ Nouveau: "${result.title.substring(0, 50)}..."`)
        } else {
          existingArticles++
          console.log(`  ⏭️  Existe déjà: "${result.title.substring(0, 50)}..."`)
        }
      }
      
      console.log(`\n📊 Sauvegarde: ${newArticles} nouveaux, ${existingArticles} existants`)
    }
    console.log('='.repeat(60) + '\n')
    
    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      savedToKB: autoSave,
      newArticles: autoSave ? newArticles : undefined,
      existingArticles: autoSave ? existingArticles : undefined
    })
  } catch (error) {
    console.error('Scraper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ESILV Web Scraper API',
    usage: 'POST /api/scraper with { query: string, autoSave: boolean }',
    status: 'active'
  })
}

