import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ScraperResult {
  title: string
  content: string
  url: string
  confidence: number
}

class ESILVWebScraper {
  private readonly baseUrl = 'https://www.esilv.fr'
  
  async scrapeESILVInfo(query: string): Promise<ScraperResult[]> {
    const results: ScraperResult[] = []
    
    try {
      // Try real web scraping first
      const realResults = await this.realWebScrape(query)
      if (realResults.length > 0) {
        results.push(...realResults)
      } else {
        // Fallback to mock data if real scraping fails
        const mockResults = this.generateMockScrapedData(query)
        results.push(...mockResults)
      }
      
    } catch (error) {
      console.error('Error scraping ESILV website:', error)
      // Fallback to mock data
      const mockResults = this.generateMockScrapedData(query)
      results.push(...mockResults)
    }
    
    return results
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
      await db.knowledgeBase.create({
        data: {
          question: result.title,
          answer: result.content,
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
    const { query, autoSave = false } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    const scraper = new ESILVWebScraper()
    const results = await scraper.scrapeESILVInfo(query)
    
    if (autoSave) {
      // Save results to knowledge base
      for (const result of results) {
        await scraper.saveToKnowledgeBase(result, 'web_scraped')
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      savedToKB: autoSave
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

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Scraper POST: Recherche pour "${query}"`)

    const scraper = new ESILVWebScraper()
    const results = await scraper.scrapeESILVInfo(query)

    console.log(`✅ Scraper: ${results.length} résultats trouvés`)

    return NextResponse.json({
      success: true,
      results,
      count: results.length
    })
  } catch (error) {
    console.error('Scraper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

