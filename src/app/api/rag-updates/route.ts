import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const updateType = searchParams.get('type')
    
    // Construire les conditions de filtre
    const whereConditions: any = {}
    if (updateType) {
      whereConditions.updateType = updateType
    }
    
    // Récupérer les mises à jour
    const updates = await db.rAGUpdate.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    // Statistiques
    const stats = {
      total: updates.length,
      byType: {
        delete: updates.filter(u => u.updateType === 'delete').length,
        add: updates.filter(u => u.updateType === 'add').length,
        update: updates.filter(u => u.updateType === 'update').length,
        verify: updates.filter(u => u.updateType === 'verify').length
      },
      byTrigger: {
        scraper: updates.filter(u => u.triggeredBy === 'scraper').length,
        manual: updates.filter(u => u.triggeredBy === 'manual').length,
        scheduled: updates.filter(u => u.triggeredBy === 'scheduled').length
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      updates, 
      count: updates.length,
      stats
    })
  } catch (error) {
    console.error('Error fetching RAG updates:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updateType, entryId, oldValue, newValue, source, query, confidence, triggeredBy } = body
    
    // Validation
    if (!updateType || !query) {
      return NextResponse.json(
        { error: 'updateType and query are required' },
        { status: 400 }
      )
    }
    
    // Créer l'entrée de log
    const logEntry = await db.rAGUpdate.create({
      data: {
        updateType,
        entryId: entryId || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        source: source || null,
        query,
        confidence: confidence || null,
        triggeredBy: triggeredBy || 'scraper'
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      logEntry 
    })
  } catch (error) {
    console.error('Error creating RAG update log:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    )
  }
}

